import type { ReactNode } from "react";
import Link from "next/link";
import { InfoTip } from "@/components/info-tip";
import { formatBig, formatPrice } from "@/lib/format";
import { priceLabel, type Instrument } from "@/lib/market/catalog";
import type { Quote } from "@/lib/market/yahoo";
import { Change } from "./change";
import { Sparkline } from "./sparkline";

/** Rango del día: dónde está el precio entre el mínimo y el máximo de hoy. */
function DayRange({ q }: { q: Quote }) {
  if (q.dayLow == null || q.dayHigh == null || q.price == null || q.dayHigh <= q.dayLow) return <span className="text-muted">—</span>;
  const pos = ((q.price - q.dayLow) / (q.dayHigh - q.dayLow)) * 100;
  return (
    <div className="w-28" title={`Mínimo ${formatPrice(q.dayLow)} · Máximo ${formatPrice(q.dayHigh)}`}>
      <div className="relative h-1.5 rounded-full bg-surface-2">
        <span className="absolute top-1/2 h-2.5 w-1 -translate-y-1/2 rounded-full bg-text" style={{ left: `calc(${Math.min(100, Math.max(0, pos))}% - 2px)` }} />
      </div>
      <div className="tabular mt-1 flex justify-between text-[10px] text-muted">
        <span>{formatPrice(q.dayLow)}</span>
        <span>{formatPrice(q.dayHigh)}</span>
      </div>
    </div>
  );
}

export function QuoteTable({
  quotes,
  hints,
  showVolume = false,
  compact = false,
  action,
}: {
  quotes: Quote[];
  hints?: Instrument[];
  showVolume?: boolean;
  compact?: boolean;
  /** Contenido extra al final de cada fila (p. ej. un botón para quitar). */
  action?: (q: Quote) => ReactNode;
}) {
  const hintBy = new Map(hints?.map((h) => [h.symbol, h.hint]));
  if (!quotes.length) return <p className="py-6 text-center text-sm text-muted">No se han podido cargar las cotizaciones. Prueba de nuevo en un momento.</p>;
  return (
    <div className="-mx-4 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted">
            <th className="px-4 py-2 font-medium">Nombre</th>
            <th className="px-2 py-2 text-right font-medium">Precio</th>
            <th className="px-2 py-2 text-right font-medium">Variación hoy</th>
            {!compact && <th className="px-2 py-2 font-medium">Hoy</th>}
            {!compact && <th className="px-2 py-2 font-medium">Rango del día</th>}
            {showVolume && <th className="px-4 py-2 text-right font-medium">Volumen</th>}
            {action && <th className="px-4 py-2" />}
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => {
            const hint = hintBy.get(q.symbol);
            return (
              <tr key={q.symbol} className="border-b border-border/60 last:border-0 hover:bg-surface-2/60">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/valor/${encodeURIComponent(q.symbol)}`} className="font-semibold hover:text-accent">
                      {q.name}
                    </Link>
                    {hint && <InfoTip text={hint} />}
                  </div>
                  <span className="font-mono text-[11px] text-muted">{q.symbol}</span>
                </td>
                <td className="tabular px-2 py-2.5 text-right font-medium">
                  {priceLabel(q.symbol, q.type, q.price, q.currency)}
                </td>
                <td className="px-2 py-2.5 text-right">
                  <Change pct={q.changePct} />
                </td>
                {!compact && (
                  <td className="px-2 py-2.5">
                    <Sparkline values={q.spark} base={q.prevClose} />
                  </td>
                )}
                {!compact && (
                  <td className="px-2 py-2.5">
                    <DayRange q={q} />
                  </td>
                )}
                {showVolume && <td className="tabular px-4 py-2.5 text-right text-muted">{formatBig(q.volume)}</td>}
                {action && <td className="px-4 py-2.5 text-right">{action(q)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Tarjeta pequeña con un índice o activo y su minigráfico. */
export function QuoteTile({ q }: { q: Quote }) {
  return (
    <Link
      href={`/valor/${encodeURIComponent(q.symbol)}`}
      className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-3.5 transition hover:border-accent/50"
    >
      <span className="truncate text-xs font-medium text-muted">{q.name}</span>
      <span className="tabular text-lg font-semibold">{priceLabel(q.symbol, q.type, q.price, null)}</span>
      <div className="flex items-end justify-between gap-2">
        <Change pct={q.changePct} className="text-sm" />
        <Sparkline values={q.spark} base={q.prevClose} width={70} height={24} />
      </div>
    </Link>
  );
}
