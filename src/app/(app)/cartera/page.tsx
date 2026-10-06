import type { ReactNode } from "react";
import Link from "next/link";
import { Star, Trash2, X } from "lucide-react";
import { deletePosition, toggleWatch } from "@/app/actions/portfolio";
import { ConfirmButton } from "@/components/confirm-button";
import { InfoTip } from "@/components/info-tip";
import { Change } from "@/components/market/change";
import { QuoteTable } from "@/components/market/quote-table";
import { SubmitButton } from "@/components/submit-button";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/dal";
import { formatDate, formatMoney, formatNumber, formatPrice, todayKey } from "@/lib/format";
import { getFxRates, getQuote, getQuotes } from "@/lib/market/yahoo";
import { getPositions, getWatchlist } from "@/lib/queries";
import { PositionForm } from "./position-form";

export const metadata = { title: "Mis valores" };

const COLORS = ["#3355dd", "#12b886", "#f59f00", "#e64980", "#7950f2", "#15aabf", "#fd7e14", "#82c91e", "#868e96"];

function Stat({ label, value, sub, tip }: { label: string; value: ReactNode; sub?: ReactNode; tip?: string }) {
  return (
    <Card>
      <p className="flex items-center gap-1 text-sm text-muted">
        {label} {tip && <InfoTip text={tip} />}
      </p>
      <p className="tabular mt-1 text-2xl font-semibold">{value}</p>
      {sub && <div className="mt-0.5 text-sm">{sub}</div>}
    </Card>
  );
}

export default async function PortfolioPage({ searchParams }: PageProps<"/cartera">) {
  const user = await requireUser();
  const { add } = await searchParams;
  const addSymbol = typeof add === "string" ? add.toUpperCase().slice(0, 32) : undefined;
  const base = user.baseCurrency;

  const [watch, lots] = await Promise.all([getWatchlist(user.id), getPositions(user.id)]);
  const [watchQuotes, posQuotes, fx, addQuote] = await Promise.all([
    getQuotes(watch.map((w) => w.symbol)),
    getQuotes(lots.map((l) => l.symbol)),
    getFxRates(lots.map((l) => l.currency), base),
    addSymbol ? getQuote(addSymbol) : null,
  ]);
  const quoteBy = new Map(posQuotes.map((q) => [q.symbol, q]));

  // Agrupa las compras por valor.
  const holdings = new Map<string, { symbol: string; name: string; currency: string; shares: number; cost: number; costBase: number }>();
  for (const l of lots) {
    const rate = fx.get(l.currency) ?? 1;
    const h = holdings.get(l.symbol) ?? { symbol: l.symbol, name: l.name, currency: l.currency, shares: 0, cost: 0, costBase: 0 };
    h.shares += l.shares;
    h.cost += l.shares * l.price + l.fees;
    // Simplificación: el coste se convierte al cambio de hoy.
    h.costBase += (l.shares * l.price + l.fees) * rate;
    holdings.set(l.symbol, h);
  }
  const rows = [...holdings.values()].map((h) => {
    const q = quoteBy.get(h.symbol);
    const rate = fx.get(h.currency) ?? 1;
    const value = q?.price != null ? q.price * h.shares * rate : null;
    const dayChange = q?.change != null ? q.change * h.shares * rate : null;
    const gain = value != null ? value - h.costBase : null;
    return { ...h, q, value, dayChange, gain, gainPct: gain != null && h.costBase ? (gain / h.costBase) * 100 : null, avg: h.cost / h.shares };
  });
  rows.sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

  const totalValue = rows.reduce((s, r) => s + (r.value ?? 0), 0);
  const totalCost = rows.reduce((s, r) => s + r.costBase, 0);
  const totalGain = totalValue - totalCost;
  const dayChange = rows.reduce((s, r) => s + (r.dayChange ?? 0), 0);
  const prevValue = totalValue - dayChange;

  return (
    <>
      <PageHeader title="Mis valores" subtitle="Lo que sigues y lo que tienes comprado, con lo que ganas o pierdes." />

      {rows.length > 0 && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Valor actual" value={formatMoney(totalValue, base)} tip={`Lo que valdrían hoy todas tus posiciones, en ${base} al cambio actual.`} />
          <Stat label="Invertido" value={formatMoney(totalCost, base)} tip="Lo que pagaste por todo (incluidas comisiones)." />
          <Stat
            label="Ganancia / pérdida"
            value={<span className={totalGain >= 0 ? "text-up" : "text-down"}>{formatMoney(totalGain, base)}</span>}
            sub={<Change pct={totalCost ? (totalGain / totalCost) * 100 : null} />}
            tip="Diferencia entre lo que vale ahora y lo que pagaste. Es «latente»: no es real hasta que vendes."
          />
          <Stat
            label="Hoy"
            value={<span className={dayChange >= 0 ? "text-up" : "text-down"}>{formatMoney(dayChange, base)}</span>}
            sub={<Change pct={prevValue ? (dayChange / prevValue) * 100 : null} />}
          />
        </div>
      )}

      <div className="space-y-6">
        {rows.length > 0 && (
          <Card>
            <CardTitle title="Cartera" />
            <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-surface-2" title="Peso de cada valor en tu cartera">
              {rows.map((r, i) => (
                <span key={r.symbol} style={{ width: `${((r.value ?? 0) / (totalValue || 1)) * 100}%`, background: COLORS[i % COLORS.length] }} />
              ))}
            </div>
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-5 py-2 font-medium">Valor</th>
                    <th className="px-2 py-2 text-right font-medium">Cantidad</th>
                    <th className="px-2 py-2 text-right font-medium">Precio medio</th>
                    <th className="px-2 py-2 text-right font-medium">Precio actual</th>
                    <th className="px-2 py-2 text-right font-medium">Hoy</th>
                    <th className="px-2 py-2 text-right font-medium">Valor ({base})</th>
                    <th className="px-2 py-2 text-right font-medium">Peso</th>
                    <th className="px-5 py-2 text-right font-medium">Ganancia</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.symbol} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                          <Link href={`/valor/${encodeURIComponent(r.symbol)}`} className="font-semibold hover:text-accent">
                            {r.name}
                          </Link>
                        </div>
                        <span className="pl-4.5 font-mono text-[11px] text-muted">{r.symbol}</span>
                      </td>
                      <td className="tabular px-2 py-2.5 text-right">{formatNumber(r.shares, r.shares % 1 ? 4 : 0)}</td>
                      <td className="tabular px-2 py-2.5 text-right">{formatPrice(r.avg, r.currency)}</td>
                      <td className="tabular px-2 py-2.5 text-right">{formatPrice(r.q?.price, r.currency)}</td>
                      <td className="px-2 py-2.5 text-right">
                        <Change pct={r.q?.changePct ?? null} />
                      </td>
                      <td className="tabular px-2 py-2.5 text-right font-medium">{formatMoney(r.value, base)}</td>
                      <td className="tabular px-2 py-2.5 text-right text-muted">{totalValue ? formatNumber(((r.value ?? 0) / totalValue) * 100, 1) : "—"} %</td>
                      <td className="px-5 py-2.5 text-right">
                        <span className={`tabular block font-medium ${(r.gain ?? 0) >= 0 ? "text-up" : "text-down"}`}>{formatMoney(r.gain, base)}</span>
                        <Change pct={r.gainPct} className="text-xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">
              Los importes en otras monedas se convierten a {base} al cambio de hoy, así que no incluyen lo que hayas ganado o perdido por
              el tipo de cambio. Tampoco se cuentan dividendos ni impuestos.
            </p>
          </Card>
        )}

        <Card id="nueva-compra" className="scroll-mt-24">
          <CardTitle title="Añadir una compra" />
          <PositionForm key={addSymbol ?? ""} symbol={addQuote?.symbol ?? addSymbol} price={addQuote?.price} today={todayKey()} />
        </Card>

        {lots.length > 0 && (
          <Card>
            <CardTitle title="Historial de compras" />
            <div className="-mx-5 overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted">
                    <th className="px-5 py-2 font-medium">Fecha</th>
                    <th className="px-2 py-2 font-medium">Valor</th>
                    <th className="px-2 py-2 text-right font-medium">Cantidad</th>
                    <th className="px-2 py-2 text-right font-medium">Precio</th>
                    <th className="px-2 py-2 text-right font-medium">Comisiones</th>
                    <th className="px-2 py-2 font-medium">Notas</th>
                    <th className="px-5 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {[...lots].reverse().map((l) => (
                    <tr key={l.id} className="border-b border-border/60 last:border-0">
                      <td className="px-5 py-2">{formatDate(l.boughtOn)}</td>
                      <td className="px-2 py-2">
                        {l.name} <span className="font-mono text-[11px] text-muted">{l.symbol}</span>
                      </td>
                      <td className="tabular px-2 py-2 text-right">{formatNumber(l.shares, l.shares % 1 ? 4 : 0)}</td>
                      <td className="tabular px-2 py-2 text-right">{formatPrice(l.price, l.currency)}</td>
                      <td className="tabular px-2 py-2 text-right">{l.fees ? formatPrice(l.fees, l.currency) : "—"}</td>
                      <td className="max-w-48 truncate px-2 py-2 text-muted">{l.notes}</td>
                      <td className="px-5 py-2 text-right">
                        <form action={deletePosition}>
                          <input type="hidden" name="id" value={l.id} />
                          <ConfirmButton message="¿Borrar esta compra? (Por ejemplo, si la vendiste o te equivocaste)" variant="ghost" className="h-8 px-2 text-muted" title="Borrar">
                            <Trash2 size={15} />
                          </ConfirmButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        <Card>
          <CardTitle
            title={
              <>
                <Star size={18} className="fill-current text-amber-500" /> Valores que sigo
              </>
            }
          />
          {watchQuotes.length ? (
            <QuoteTable
              quotes={watchQuotes}
              action={(q) => (
                <form action={toggleWatch}>
                  <input type="hidden" name="symbol" value={q.symbol} />
                  <SubmitButton variant="ghost" className="h-8 px-2 text-muted" title="Dejar de seguir">
                    <X size={15} />
                  </SubmitButton>
                </form>
              )}
            />
          ) : (
            <p className="py-4 text-center text-sm text-muted">
              Aún no sigues ningún valor. Busca una empresa arriba, ábrela y pulsa «Seguir».
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
