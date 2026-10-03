import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "./prisma";

export const SESSION_COOKIE = "psl_session";
const SESSION_DAYS = 30;

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

export async function createSession(userId: string): Promise<void> {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Reads the signed session cookie and loads the user. Returns null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const userId = payload.sub;
    if (!userId) return null;

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
    if (!user) return null;

    const retailerStatus = user.retailerProfile?.status ?? null;
    return {
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
  } catch {
    return null;
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
