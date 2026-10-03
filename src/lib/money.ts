/** All money in this codebase is stored in kobo (NGN minor units) as integers. */

export function toKobo(naira: number): number {
  return Math.round(naira * 100);
}

export function toNaira(kobo: number): number {
  return Math.round(kobo) / 100;
}

export function formatNaira(kobo: number, opts?: { compact?: boolean }): string {
  const naira = toNaira(kobo);
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...(opts?.compact ? { notation: "compact" as const } : {}),
  }).format(naira);
}

export function formatNairaPlain(kobo: number): string {
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(toNaira(kobo));
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

export function formatDateTime(d: Date | string): string {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export function relativeDays(d: Date | string): string {
  const diff = Math.round((new Date(d).getTime() - Date.now()) / 86_400_000);
  if (diff === 0) return "today";
  if (diff === 1) return "tomorrow";
  if (diff === -1) return "yesterday";
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function orderReference(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `PSL-${stamp}${rand}`;
}