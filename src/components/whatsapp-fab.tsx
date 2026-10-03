"use client";

import { useState } from "react";
import { MessageCircle, X, Phone, Truck, Shirt, Store, RefreshCcw } from "lucide-react";
import { presetLinks, whatsappNumber } from "@/lib/whatsapp";

type QuickAction = {
  key: keyof ReturnType<typeof presetLinks>;
  label: string;
  icon: typeof Phone;
  tone: string;
};

const QUICK_ACTIONS: QuickAction[] = [
  { key: "general", label: "General enquiry", icon: MessageCircle, tone: "hover:bg-royal-800" },
  { key: "orderStatus", label: "Track my order", icon: Truck, tone: "hover:bg-royal-800" },
  { key: "bespoke", label: "Commission bespoke", icon: Shirt, tone: "hover:bg-royal-800" },
  { key: "wholesale", label: "Wholesale pricing", icon: Store, tone: "hover:bg-royal-800" },
  { key: "returns", label: "Returns & exchanges", icon: RefreshCcw, tone: "hover:bg-royal-800" },
];

export function WhatsAppFab() {
  const [open, setOpen] = useState(false);
  const links = presetLinks();
  const number = whatsappNumber();

  return (
    <div className="fixed bottom-5 right-5 z-[70] flex flex-col items-end gap-3 print:hidden">
      {open && (
        <div className="animate-rise w-72 overflow-hidden rounded-2xl border border-royal-900/10 bg-white shadow-2xl">
          <div className="bg-royal-900 px-4 py-3 text-white">
            <p className="text-sm font-semibold">Chat with Patience Sewing</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-royal-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Typically replies in a few minutes
            </p>
          </div>
          <div className="p-2">
            {QUICK_ACTIONS.map((action) => (
              <a
                key={action.key}
                href={links[action.key]}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-royal-950 transition-colors ${action.tone}`}
              >
                <action.icon className="h-4 w-4 shrink-0 text-gold-600" />
                {action.label}
              </a>
            ))}
          </div>
          <div className="border-t border-royal-900/10 px-4 py-2.5 text-center text-[0.7rem] text-royal-900/50">
            +{number}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {open && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-royal-900 shadow-lg transition-colors hover:bg-royal-50"
            aria-label="Close WhatsApp menu"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="group flex h-14 items-center gap-2.5 rounded-full bg-[#25D366] px-4 text-white shadow-xl transition-transform hover:scale-105"
          aria-label="Open WhatsApp chat menu"
          aria-expanded={open}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="pr-1 text-sm font-semibold">Chat with us</span>
        </button>
      </div>
    </div>
  );
}