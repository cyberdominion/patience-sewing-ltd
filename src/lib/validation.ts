import { z } from "zod";

const phone = z
  .string()
  .min(7, "Enter a valid phone number")
  .regex(/^[0-9+\s()-]{7,20}$/, "Enter a valid phone number");

export const registerSchema = z.object({
  fullName: z.string().min(2, "Enter your full name").max(120),
  email: z.string().email("Enter a valid email address"),
  phone,
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export const newsletterSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  source: z.string().optional(),
});

export const contactSchema = z.object({
  fullName: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email address"),
  phone: phone.optional().or(z.literal("")),
  subject: z.string().optional(),
  message: z.string().min(10, "Please give us a little more detail"),
});

export const addToCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
  size: z.string().max(40).optional(),
  colourway: z.string().max(60).optional(),
  notes: z.string().max(500).optional(),
});

export const updateCartSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(99),
  size: z.string().max(40).optional().nullable(),
  colourway: z.string().max(60).optional().nullable(),
});

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "Enter the name on the order"),
  customerEmail: z.string().email("Enter a valid email address"),
  customerPhone: phone,
  shippingLine1: z.string().min(4, "Enter your delivery address"),
  shippingCity: z.string().min(2, "Enter your city"),
  shippingState: z.string().min(2).default("Bayelsa"),
  shippingCountry: z.string().default("Nigeria"),
  deliveryNotes: z.string().max(500).optional(),
  isCustomBespoke: z.coerce.boolean().default(false),
  designBrief: z.string().max(2000).optional(),
  measurements: z.string().max(4000).optional(),
  saveDetails: z.coerce.boolean().default(false),
});

export const retailerApplicationSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  email: z.string().email("Enter a valid email address"),
  phone,
  businessName: z.string().min(2, "Enter your business name"),
  businessType: z.string().min(2, "Tell us what kind of shop you run"),
  shopAddress: z.string().min(4, "Enter your shop address"),
  city: z.string().min(2, "Enter your city"),
  state: z.string().min(2).default("Bayelsa"),
  yearsInBusiness: z.coerce.number().int().min(0).max(80).optional(),
  monthlyVolume: z.string().max(80).optional(),
  categories: z.array(z.string()).min(1, "Choose at least one category"),
  note: z.string().max(1500).optional(),
  password: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const productSchema = z.object({
  name: z.string().min(2, "Enter the product name").max(140),
  slug: z.string().max(160).optional(),
  subtitle: z.string().max(180).optional(),
  description: z.string().min(20, "Add a description of at least 20 characters"),
  category: z.enum([
    "DRESSES",
    "TWO_PIECE",
    "THREE_PIECE",
    "CAPSULES",
    "OUTERWEAR",
    "ACCESSORIES",
    "CUSTOM_BESPOKE",
  ]),
  fabric: z.string().max(160).optional(),
  colourways: z.array(z.string()).default([]),
  sizes: z.array(z.string()).min(1, "Add at least one size"),
  styleCode: z.string().max(60).optional(),
  bespoke: z.coerce.boolean().default(false),
  retailPrice: z.coerce.number().int().min(100, "Retail price must be at least NGN 1"),
  wholesalePrice: z.coerce.number().int().min(100, "Wholesale price must be at least NGN 1"),
  wholesaleMinQty: z.coerce.number().int().min(1).max(500).default(6),
  compareAtPrice: z.coerce.number().int().min(0).optional().nullable(),
  stock: z.coerce.number().int().min(0).default(0),
  lowStockAlert: z.coerce.number().int().min(0).default(5),
  leadTimeDays: z.coerce.number().int().min(1).max(365).default(14),
  images: z.array(z.string().url().or(z.string().startsWith("/"))).default([]),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).default("DRAFT"),
  featured: z.coerce.boolean().default(false),
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().max(160).optional(),
  seoDescription: z.string().max(300).optional(),
});

export const leadSchema = z.object({
  fullName: z.string().min(2, "Enter the lead name"),
  email: z.string().email().optional().or(z.literal("")),
  phone,
  city: z.string().max(80).optional(),
  state: z.string().max(80).default("Bayelsa"),
  source: z.enum([
    "WHATSAPP",
    "INSTAGRAM",
    "FACEBOOK",
    "WEBSITE",
    "REFERRAL",
    "WALK_IN",
    "MARKET",
    "PAYMENT_LINK",
    "OTHER",
  ]).default("WHATSAPP"),
  stage: z
    .enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"])
    .default("NEW"),
  interestedIn: z.string().max(200).optional(),
  budgetRange: z.string().max(80).optional(),
  timeline: z.string().max(120).optional(),
  orderValueEstimate: z.coerce.number().int().min(0).default(0),
  notes: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
  ownerId: z.string().optional().nullable(),
});

export const followUpSchema = z.object({
  leadId: z.string().min(1),
  channel: z.enum(["WHATSAPP", "PHONE", "EMAIL", "SMS", "IN_PERSON"]).default("WHATSAPP"),
  scheduledAt: z.coerce.date(),
  aiSummary: z.string().max(600).optional(),
  aiSuggestedMessage: z.string().max(1500).optional(),
  aiTone: z.string().max(40).optional(),
  aiModel: z.string().max(80).optional(),
  finalMessage: z.string().max(1500).optional(),
});

export const retailReviewSchema = z.object({
  applicationId: z.string().min(1),
  decision: z.enum(["APPROVED", "REJECTED", "SUSPENDED"]),
  discountPercent: z.coerce.number().int().min(0).max(60).default(20),
  creditLimit: z.coerce.number().int().min(0).default(0),
  reviewNote: z.string().max(800).optional(),
});

export const orderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "PENDING",
    "PAID",
    "IN_PRODUCTION",
    "READY_TO_SHIP",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED",
  ]),
});

export const settingsSchema = z.object({
  businessName: z.string().min(2),
  tagline: z.string().min(2),
  whatsappNumber: z.string().min(8),
  supportEmail: z.string().email(),
  supportPhone: z.string().min(7),
  instagramHandle: z.string().max(60).optional(),
  facebookUrl: z.string().max(200).optional(),
  tiktokHandle: z.string().max(60).optional(),
  deliveryFee: z.coerce.number().int().min(0),
  freeDeliveryThreshold: z.coerce.number().int().min(0),
  bankName: z.string().max(120).optional(),
  bankAccountNumber: z.string().max(20).optional(),
  bankAccountName: z.string().max(120).optional(),
  aiModel: z.string().max(80).default("gpt-4o-mini"),
  aiEnabled: z.coerce.boolean().default(true),
});

export const reviewSchema = z.object({
  productId: z.string().min(1),
  authorName: z.string().min(2, "Enter your name"),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10, "Please write a little more about your experience"),
});

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again";
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}