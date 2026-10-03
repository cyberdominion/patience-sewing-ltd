"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const CartCountContext = createContext<{ count: number; setCount: (n: number) => void }>({
  count: 0,
  setCount: () => {},
});

export function useCartCount() {
  return useContext(CartCountContext);
}

export function CartCountProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const read = () => {
      const match = document.cookie.match(/(?:^|;\s*)psl_cart=([^;]*)/);
      if (!match) {
        setCount(0);
        return;
      }
      try {
        const decoded = decodeURIComponent(match[1]);
        const parsed = JSON.parse(decoded) as { lines: { quantity: number }[] };
        setCount(parsed.lines.reduce((sum, l) => sum + (l.quantity ?? 0), 0));
      } catch {
        setCount(0);
      }
    };
    read();
    window.addEventListener("psl:cart-changed", read);
    return () => window.removeEventListener("psl:cart-changed", read);
  }, []);

  return (
    <CartCountContext.Provider value={{ count, setCount }}>
      <CartSyncBridge router={router} />
      {children}
    </CartCountContext.Provider>
  );
}

/** Re-reads the cookie after a server action changes the cart. */
function CartSyncBridge({ router }: { router: ReturnType<typeof useRouter> }) {
  useEffect(() => {
    const handler = () => {
      router.refresh();
    };
    window.addEventListener("psl:cart-updated", handler);
    return () => window.removeEventListener("psl:cart-updated", handler);
  }, [router]);

  return null;
}