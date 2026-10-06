"use client";

import { useActionState, useState } from "react";
import { loginAction, registerAction } from "@/app/(auth)/actions";
import { initialState } from "@/lib/action-types";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState());
  const [show, setShow] = useState(false);
  const errors = state.errors ?? {};

  return (
    <form action={action} className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-royal-950">Sign in</h2>

      {next && <input type="hidden" name="next" value={next} />}

      {state.message && !state.ok && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </p>
      )}

      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={`input ${errors.email ? "border-red-400" : ""}`}
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            className="input pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-royal-900/40 hover:text-royal-900"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full !py-3">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Signing in" : "Sign in"}
      </button>

      {process.env.NODE_ENV !== "production" && (
        <p className="text-center text-xs text-royal-900/50">
          Seeded demo accounts: admin@patiencesewing.com / admin1234
        </p>
      )}
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState());
  const [open, setOpen] = useState(false);
  const errors = state.errors ?? {};

  return (
    <>
      <button type="button" onClick={() => setOpen((v) => !v)} className="btn btn-outline w-full">
        {open ? "Hide registration" : "Create a customer account"}
      </button>

      {open && (
        <form action={action} className="mt-6 space-y-4">
          {state.message && !state.ok && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {state.message}
            </p>
          )}

          <div>
            <label className="label" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              className={`input ${errors.fullName ? "border-red-400" : ""}`}
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
          </div>
          <div>
            <label className="label" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`input ${errors.email ? "border-red-400" : ""}`}
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="label" htmlFor="reg-phone">
              WhatsApp number
            </label>
            <input
              id="reg-phone"
              name="phone"
              type="tel"
              placeholder="0803 000 0000"
              required
              className={`input ${errors.phone ? "border-red-400" : ""}`}
            />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
          <div>
            <label className="label" htmlFor="reg-password">
              Password
            </label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className={`input ${errors.password ? "border-red-400" : ""}`}
            />
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>
          <button type="submit" disabled={pending} className="btn btn-gold w-full">
            {pending ? "Creating account" : "Create account"}
          </button>
        </form>
      )}
    </>
  );
}