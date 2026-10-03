export type ActionState = {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
  /** Extra values to repopulate a form after a failed submit. */
  values?: Record<string, string | string[]>;
  /** Optional follow-up action button on a toast. */
  action?: { href: string; label: string };
  /** Cart item count after a successful add, used by the header badge. */
  count?: number;
};

export type SubscribeState = ActionState & { subscribed?: boolean };

export function initialState(message = ""): ActionState {
  return { ok: false, message };
}

export function failure(message: string, errors?: Record<string, string>): ActionState {
  return { ok: false, message, errors };
}

export function success(message: string): ActionState {
  return { ok: true, message, errors: undefined };
}

/** Normalises thrown server-action errors into a safe message for the UI. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "UNAUTHENTICATED") return "Please sign in to continue.";
    if (error.message === "FORBIDDEN") return "You do not have access to this page.";
    return error.message;
  }
  return "Something went wrong. Please try again.";
}