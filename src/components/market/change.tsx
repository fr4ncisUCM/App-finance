import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatChange, formatPercent } from "@/lib/format";

export function tone(value: number | null | undefined) {
  if (value == null || value === 0) return "text-muted";
  return value > 0 ? "text-up" : "text-down";
}

/** Variación porcentual coloreada (verde sube, rojo baja). */
export function Change({ pct, abs, className = "", arrow = false }: { pct: number | null; abs?: number | null; className?: string; arrow?: boolean }) {
  return (
    <span className={`tabular inline-flex items-center gap-0.5 font-semibold ${tone(pct)} ${className}`}>
      {arrow && pct != null && pct !== 0 && (pct > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />)}
      {abs !== undefined && <span className="mr-1.5">{formatChange(abs)}</span>}
      {formatPercent(pct)}
    </span>
  );
}

/** Píldora de color con la variación, para tarjetas. */
export function ChangePill({ pct }: { pct: number | null }) {
  const bg = pct == null || pct === 0 ? "bg-surface-2 text-muted" : pct > 0 ? "bg-up/12 text-up" : "bg-down/12 text-down";
  return <span className={`tabular rounded-md px-1.5 py-0.5 text-xs font-semibold ${bg}`}>{formatPercent(pct)}</span>;
}
