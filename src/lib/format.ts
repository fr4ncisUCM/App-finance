// Formateo de números y fechas en español.

const nf = (min: number, max: number) =>
  new Intl.NumberFormat("es-ES", { minimumFractionDigits: min, maximumFractionDigits: max });

/** Precio con decimales adaptados a su tamaño (cripto pequeñas, divisas, índices…). */
export function formatPrice(value: number | null | undefined, currency?: string | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 2 : abs >= 1 ? 2 : abs >= 0.01 ? 4 : 6;
  const text = nf(digits, digits).format(value);
  return currency ? `${text} ${currencySymbol(currency)}` : text;
}

export function formatNumber(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return nf(digits, digits).format(value);
}

export function formatPercent(value: number | null | undefined, { sign = true, digits = 2 } = {}) {
  if (value == null || !Number.isFinite(value)) return "—";
  const text = nf(digits, digits).format(Math.abs(value));
  const prefix = !sign ? (value < 0 ? "-" : "") : value > 0 ? "+" : value < 0 ? "−" : "";
  return `${prefix}${text} %`;
}

export function formatChange(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  const text = abs >= 0.01 || abs === 0 ? nf(2, 2).format(abs) : nf(4, 4).format(abs);
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${text}`;
}

/** 1.234.567.890 → «1,23 mil mill.» (millones / miles de millones / billones, en español). */
export function formatBig(value: number | null | undefined, currency?: string | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  let text: string;
  if (abs >= 1e12) text = `${nf(2, 2).format(value / 1e12)} billones`;
  else if (abs >= 1e9) text = `${nf(2, 2).format(value / 1e9)} mil mill.`;
  else if (abs >= 1e6) text = `${nf(2, 2).format(value / 1e6)} mill.`;
  else if (abs >= 1e3) text = `${nf(1, 1).format(value / 1e3)} mil`;
  else text = nf(0, 0).format(value);
  return currency ? `${text} ${currencySymbol(currency)}` : text;
}

export function currencySymbol(currency: string) {
  const map: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", GBp: "p", CHF: "CHF", HKD: "HK$" };
  return map[currency] ?? currency;
}

export function formatMoney(value: number | null | undefined, currency = "EUR") {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

const TZ = "Europe/Madrid";

export function formatDate(date: Date | string | number, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("es-ES", { timeZone: TZ, ...opts }).format(new Date(date));
}

export function formatDateTime(date: Date | string | number) {
  return formatDate(date, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** «hace 5 min», «hace 3 h», «ayer»… */
export function timeAgo(date: Date | string | number) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 172800) return "ayer";
  return formatDate(date, { day: "numeric", month: "short" });
}

/** Fecha de hoy en Madrid como AAAA-MM-DD. */
export function todayKey() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function longToday() {
  const s = formatDate(new Date(), { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
