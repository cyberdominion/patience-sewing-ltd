"use client";

import { useActionState, useState } from "react";
import { Save, Loader2, MapPin, Plus, Trash2, X } from "lucide-react";
import { addAddressAction, deleteAddressAction, updateProfileAction } from "@/app/(auth)/actions";
import { initialState } from "@/lib/action-types";

const STATES = [
  "Bayelsa", "Rivers", "Lagos", "Abuja", "FCT", "Delta", "Enugu", "Oyo", "Imo", "Anambra",
  "Kwara", "Kaduna", "Kano", "Ogun", "Ondo", "Osun", "Plateau", "Niger", "Akwa Ibom",
  "Cross River", "Edo", "Abia", "Benue", "Borno", "Adamawa", "Bauchi", "Taraba", "Yobe", "Other",
];

export function ProfileForms({
  user,
  addresses,
}: {
  user: { fullName: string; email: string; phone: string };
  addresses: { id: string; label: string; line1: string; city: string; state: string; country: string }[];
}) {
  const [profileState, profileAction, profilePending] = useActionState(
    updateProfileAction,
    initialState(),
  );
  const [adding, setAdding] = useState(false);

  return (
    <div className="space-y-8">
      <section className="card p-6">
        <h2 className="font-display text-xl font-semibold text-royal-950">Your details</h2>
        <p className="mt-1.5 text-sm text-royal-900/60">
          We use your WhatsApp number to confirm every order, so keep it accurate.
        </p>

        <form action={profileAction} className="mt-5 space-y-4">
          {profileState.message && (
            <p
              role="status"
              className={`rounded-lg p-3 text-sm ${
                profileState.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
              }`}
            >
              {profileState.message}
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="p-name">
                Full name
              </label>
              <input
                id="p-name"
                name="fullName"
                defaultValue={user.fullName}
                required
                className={`input ${profileState.errors?.fullName ? "border-red-400" : ""}`}
              />
              {profileState.errors?.fullName && (
                <p className="mt-1 text-xs text-red-600">{profileState.errors.fullName}</p>
              )}
            </div>
            <div>
              <label className="label" htmlFor="p-phone">
                WhatsApp number
              </label>
              <input
                id="p-phone"
                name="phone"
                type="tel"
                defaultValue={user.phone}
                required
                className={`input ${profileState.errors?.phone ? "border-red-400" : ""}`}
              />
              {profileState.errors?.phone && (
                <p className="mt-1 text-xs text-red-600">{profileState.errors.phone}</p>
              )}
            </div>
          </div>

          <div>
            <label className="label" htmlFor="p-email">
              Email
            </label>
            <input
              id="p-email"
              value={user.email}
              readOnly
              disabled
              className="input bg-royal-50/50 text-royal-900/60"
            />
            <p className="mt-1 text-xs text-royal-900/45">
              Message us on WhatsApp if you need the email changed.
            </p>
          </div>

          <button type="submit" disabled={profilePending} className="btn btn-primary">
            {profilePending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {profilePending ? "Saving" : "Save details"}
          </button>
        </form>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-royal-950">
            <MapPin className="h-4 w-4 text-gold-600" /> Delivery addresses
          </h2>
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="btn btn-outline !py-2 text-sm"
          >
            {adding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {adding ? "Cancel" : "Add address"}
          </button>
        </div>

        {adding && (
          <AddAddressForm onDone={() => setAdding(false)} />
        )}

        {addresses.length === 0 && !adding ? (
          <p className="mt-5 text-sm text-royal-900/55">
            No saved addresses yet. Add one to check out faster.
          </p>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {addresses.map((address) => (
              <li key={address.id} className="rounded-xl border border-royal-900/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-royal-900/45">
                      {address.label}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-royal-900/80">
                      {[address.line1, address.city, address.state, address.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="id" value={address.id} />
                    <button
                      type="submit"
                      className="rounded-lg p-2 text-royal-900/40 transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label="Delete address"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function AddAddressForm({ onDone }: { onDone: () => void }) {
  const [state, action, pending] = useActionState(addAddressAction, initialState());

  return (
    <form action={action} className="mt-5 rounded-xl border border-royal-900/10 bg-royal-50/40 p-5">
      <input type="hidden" name="saveDetails" value="true" />

      {state.message && (
        <p
          role="status"
          className={`mb-4 rounded-lg p-3 text-sm ${
            state.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="a-label">
            Label
          </label>
          <input id="a-label" name="label" defaultValue="Home" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="a-state">
            State
          </label>
          <select id="a-state" name="state" defaultValue="Bayelsa" className="input">
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="a-line1">
            Street address
          </label>
          <input id="a-line1" name="line1" required className="input" placeholder="House number, street" />
        </div>
        <div>
          <label className="label" htmlFor="a-city">
            City
          </label>
          <input id="a-city" name="city" required className="input" />
        </div>
      </div>

      <div className="mt-5 flex gap-3">
        <button type="submit" disabled={pending} className="btn btn-primary !py-2 text-sm">
          {pending ? "Saving" : "Save address"}
        </button>
        <button type="button" onClick={onDone} className="btn btn-ghost !py-2 text-sm">
          Cancel
        </button>
      </div>
    </form>
  );
}