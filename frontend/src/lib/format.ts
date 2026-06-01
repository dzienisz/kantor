export function flagEmoji(code: string): string {
  // code to 2-literowy kod kraju (np. "EU","US"). EU traktujemy specjalnie.
  if (!code) return "";
  if (code.toUpperCase() === "EU") return "\u{1F1EA}\u{1F1FA}";
  const cc = code.toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(cc)) return "";
  return String.fromCodePoint(
    ...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65),
  );
}

const plnFmt = new Intl.NumberFormat("pl-PL", {
  style: "currency",
  currency: "PLN",
  minimumFractionDigits: 2,
});

export function pln(value: number): string {
  return plnFmt.format(value);
}

export function rate(value: number): string {
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
}

export function amount(value: number): string {
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const STATUS_LABEL: Record<string, string> = {
  pending: "Oczekuje",
  confirmed: "Potwierdzona",
  ready: "Gotowa do odbioru",
  completed: "Zrealizowana",
  cancelled: "Anulowana",
};

export const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  ready: "bg-emerald-100 text-emerald-800",
  completed: "bg-slate-200 text-slate-700",
  cancelled: "bg-rose-100 text-rose-800",
};
