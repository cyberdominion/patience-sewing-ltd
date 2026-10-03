"use client";

import { useCallback, useEffect, useState, createContext, useContext, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type Tone = "success" | "error" | "info";

type ToastAction = { href: string; label: string };

type Toast = {
  id: number;
  message: string;
  tone: Tone;
  action?: ToastAction;
};

type ToastContextValue = {
  push: (message: string, tone?: Tone, action?: ToastAction) => void;
};

const ToastContext = createContext<ToastContextValue>({ push: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export type ToastDetail = { message: string; tone?: Tone; href?: string; hrefLabel?: string };

export function Toaster({ children }: { children?: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: Tone = "info", action?: ToastAction) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, tone, action }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  // Lets server actions surface feedback: window.dispatchEvent(new CustomEvent("psl:toast", { detail }))
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      if (!detail?.message) return;
      push(detail.message, detail.tone ?? "info", {
        href: detail.href ?? "",
        label: detail.hrefLabel ?? "View",
      });
    };
    window.addEventListener("psl:toast", handler);
    return () => window.removeEventListener("psl:toast", handler);
  }, [push]);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[90] flex flex-col items-center gap-2 px-4 print:hidden sm:bottom-8">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            aria-live="polite"
            className={[
              "animate-rise pointer-events-auto flex max-w-md items-center gap-3 rounded-full py-2.5 pl-4 pr-2.5 text-sm font-medium shadow-xl",
              t.tone === "success"
                ? "bg-royal-900 text-gold-100"
                : t.tone === "error"
                  ? "bg-red-600 text-white"
                  : "bg-ink text-white",
            ].join(" ")}
          >
            {t.tone === "success" ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : t.tone === "error" ? (
              <AlertCircle className="h-4 w-4 shrink-0" />
            ) : (
              <Info className="h-4 w-4 shrink-0" />
            )}
            <span>{t.message}</span>
            {t.action?.href && (
              <a
                href={t.action.href}
                className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold transition-colors hover:bg-white/25"
              >
                {t.action.label}
              </a>
            )}
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-full p-1 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}