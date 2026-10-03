/** Digits-only Nigerian number in international format, safe for both server and client. */
export function normalisePhone(input: string): string {
  const digits = input.replace(/[^\d]/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

export function formatPhoneForDisplay(input: string): string {
  const n = normalisePhone(input);
  if (n.length === 13) {
    return `+${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6, 9)} ${n.slice(9)}`;
  }
  return input;
}