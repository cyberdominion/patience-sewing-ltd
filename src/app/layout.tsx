import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { WhatsAppFab } from "@/components/whatsapp-fab";
import { CartCountProvider } from "@/components/cart-count-provider";
import { Toaster } from "@/components/toaster";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const body = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Patience Sewing Ltd | Bespoke Nigerian Dresses, Yenagoa",
    template: "%s | Patience Sewing Ltd",
  },
  description:
    "Patience Sewing Ltd is a bespoke Nigerian fashion house and factory in Yenagoa, Bayelsa State. Buy our dresses at retail prices or open a wholesale account for your boutique.",
  keywords: [
    "bespoke dresses Nigeria",
    "Bayelsa fashion",
    "Yenagoa tailor",
    "wholesale dresses Nigeria",
    "aso oke dresses",
    "lace dresses Nigeria",
    "Ankara fashion",
    "Nigerian designer",
  ],
  authors: [{ name: "Patience Sewing Ltd" }],
  openGraph: {
    type: "website",
    siteName: "Patience Sewing Ltd",
    locale: "en_NG",
    url: SITE_URL,
    title: "Patience Sewing Ltd | Bespoke Nigerian Dresses",
    description:
      "Hand-cut, hand-stitched Nigerian occasionwear. Retail prices for you, wholesale prices for your boutique.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Patience Sewing Ltd",
    description: "Bespoke Nigerian fashion, cut and stitched to measure.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/logo.png", sizes: "any", type: "image/png" }],
    apple: "/logo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1a6a",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full`}>
      <body className="flex min-h-full flex-col">
        <CartCountProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <WhatsAppFab />
          <Toaster />
        </CartCountProvider>
      </body>
    </html>
  );
}