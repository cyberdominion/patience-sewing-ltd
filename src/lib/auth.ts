import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "psl_session";
export const LAST_ACTIVE_COOKIE = "psl_last_active";

const SESSION_DAYS = 30;
const ADMIN_SESSION_HOURS = 8;
const INACTIVITY_HOURS = 24;

export type Role = "ADMIN" | "RETAILER" | "CUSTOMER";

export type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: Role;
  isApprovedRetailer: boolean;
  retailerStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | null;
  businessName: string | null;
  discountPercent: number;
};

function sessionMaxAgeMs(role: Role): number {
  if (role === "ADMIN") return ADMIN_SESSION_HOURS * 60 * 60 * 1000;
  return SESSION_DAYS * 24 * 60 * 60 * 1000;
}

function inactivityMaxAgeMs(): number {
  return INACTIVITY_HOURS * 60 * 60 * 1000;
}

/** Placeholders from .env.example that must never guard real sessions. */
const WEAK_SECRETS = new Set([
  "dev-only-secret-change-me-in-production-0123456789abcdef",
  "change-me",
  "changeme",
]);

function secretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set and at least 32 characters long");
  }

  const isProduction = process.env.NODE_ENV === "production";
  if (isProduction && (WEAK_SECRETS.has(secret.trim()) || secret.startsWith("dev-only"))) {
    throw new Error(
      "AUTH_SECRET is still the example value. Generate one with `openssl rand -base64 32` before deploying.",
    );
  }

  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string, role: Role): Promise<void> {
  const token = await new SignJWT({ sub: userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const now = Date.now();
  const maxAge = sessionMaxAgeMs(role);

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(maxAge / 1000),
  });
  store.set(LAST_ACTIVE_COOKIE, String(now), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(inactivityMaxAgeMs() / 1000),
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(LAST_ACTIVE_COOKIE);
}

async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(LAST_ACTIVE_COOKIE);
}

/** Reads the signed session cookie and loads the user. Returns null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = payload.sub;
    const role = (payload.role as Role) || "CUSTOMER";
    if (!userId) return null;

    const now = Date.now();
    const lastActive = store.get(LAST_ACTIVE_COOKIE)?.value;

    let lastActiveTime: number;
    if (lastActive) {
      lastActiveTime = Number(lastActive);
      if (!Number.isFinite(lastActiveTime)) {
        await clearSession();
        return null;
      }
    } else {
      const iat = payload.iat;
      if (!iat || typeof iat !== "number") {
        await clearSession();
        return null;
      }
      lastActiveTime = iat * 1000;
    }

    if (now - lastActiveTime > inactivityMaxAgeMs()) {
      await clearSession();
      return null;
    }
    if (now - lastActiveTime > sessionMaxAgeMs(role)) {
      await clearSession();
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        retailerProfile: {
          select: { status: true, businessName: true, discountPercent: true },
        },
      },
    });
    if (!user) {
      await clearSession();
      return null;
    }

    const retailerStatus = user.retailerProfile?.status ?? null;
    const sessionUser: SessionUser = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      isApprovedRetailer: user.role === "RETAILER" && retailerStatus === "APPROVED",
      retailerStatus,
      businessName: user.retailerProfile?.businessName ?? null,
      discountPercent:
        user.role === "RETAILER" && retailerStatus === "APPROVED"
          ? user.retailerProfile!.discountPercent
          : 0,
    };

    store.set(LAST_ACTIVE_COOKIE, String(Date.now()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.floor(inactivityMaxAgeMs() / 1000),
    });

    return sessionUser;
  } catch {
    return null;
  }
}

export async function debugSessionUser(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return "No session cookie found";

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = payload.sub;
    const role = (payload.role as Role) || "CUSTOMER";
    if (!userId) return "JWT valid but no userId in payload";

    const now = Date.now();
    const lastActive = store.get(LAST_ACTIVE_COOKIE)?.value;
    if (lastActive) {
      const lastActiveTime = Number(lastActive);
      if (!Number.isFinite(lastActiveTime)) return "Invalid last_active timestamp";
      if (now - lastActiveTime > inactivityMaxAgeMs()) return "Inactivity timeout exceeded";
      if (now - lastActiveTime > sessionMaxAgeMs(role)) return "Session max age exceeded";
    } else {
      const iat = payload.iat;
      if (!iat || typeof iat !== "number") return "No last_active cookie and no JWT iat";
      const lastActiveTime = iat * 1000;
      if (now - lastActiveTime > inactivityMaxAgeMs()) return "Inactivity timeout exceeded (from iat)";
      if (now - lastActiveTime > sessionMaxAgeMs(role)) return "Session max age exceeded (from iat)";
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, phone: true, role: true },
    });
    if (!user) return "User not found in database";
    if (user.role !== "ADMIN") return `User role is ${user.role}, not ADMIN`;

    return null;
  } catch (error) {
    return `JWT verification failed: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user || user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return bcrypt.hash(plain, 12);
}

/** Normalises Nigerian phone numbers to 234XXXXXXXXXX for WhatsApp links. */
export function normalisePhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}
