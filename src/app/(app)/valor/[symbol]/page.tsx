import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Plus, Sparkles } from "lucide-react";
import { explainCompanyAction } from "@/app/actions/ai";
import { AiPanel } from "@/components/ai-panel";
import { InfoTip } from "@/components/info-tip";
import { Change } from "@/components/market/change";
import { PriceChart } from "@/components/market/price-chart";
import { NewsList } from "@/components/news-list";
import { Card, CardTitle, Chip, Tabs } from "@/components/ui";
import { WatchButton } from "@/components/watch-button";
import { aiEnabled, companyKey, readNote } from "@/lib/ai";
import { requireUser } from "@/lib/dal";
import { formatBig, formatDate, formatDateTime, formatNumber, formatPercent, formatPrice, todayKey } from "@/lib/format";
import { knownInstrument, priceLabel } from "@/lib/market/catalog";
import { getNewsAbout } from "@/lib/market/news";
import { getChart, getDetails, getQuote, isRange, RANGES, typeLabel, type ChartData, type Details, type RangeKey } from "@/lib/market/yahoo";
import { isWatched } from "@/lib/queries";

export const maxDuration = 300;

export async function generateMetadata({ params }: PageProps<"/valor/[symbol]">): Promise<Metadata> {
  const symbol = decodeURIComponent((await params).symbol);
  return { title: knownInstrument(symbol)?.name ?? symbol };
}

const RANGE_LABELS: Record<RangeKey, string> = { "1D": "1 día", "5D": "5 días", "1M": "1 mes", "6M": "6 meses", YTD: "Este año", "1A": "1 año", "5A": "5 años", MAX: "Todo" };

const RECOMMENDATION: Record<string, string> = {
  strong_buy: "Compra fuerte",
  buy: "Comprar",
  hold: "Mantener",
  underperform: "Peor que el mercado",
  sell: "Vender",
  strong_sell: "Venta fuerte",
};

function Metric({ label, value, tip }: { label: string; value: string; tip: string }) {
  return (
    <div className="rounded-xl bg-surface-2/60 p-3">
      <dt className="flex items-center gap-1 text-xs text-muted">
        {label} <InfoTip text={tip} />
      </dt>
      <dd className="tabular mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}

/** Rentabilidad en distintos plazos a partir de la serie semanal de 5 años. */
function returns(weekly: ChartData, price: number | null) {
  const pts = weekly.points;
  if (!pts.length || price == null) return [];
  const now = Date.now();
  const at = (ms: number) => {
    let found: number | null = null;
    for (const p of pts) if (p.t <= ms) found = p.c;
    return found;
  };
  const jan1 = new Date(new Date().getFullYear(), 0, 1).getTime();
  const periods: [string, number | null][] = [
    ["1 mes", at(now - 30 * 86400_000)],
    ["6 meses", at(now - 182 * 86400_000)],
    ["Este año", at(jan1)],
    ["1 año", at(now - 365 * 86400_000)],
    ["3 años", at(now - 3 * 365 * 86400_000)],
    ["5 años", pts[0].t <= now - 4.9 * 365 * 86400_000 ? pts[0].c : null],
  ];
  return periods.map(([label, past]) => ({ label, pct: past ? ((price - past) / past) * 100 : null }));
}

function Fundamentals({ d, high52, low52 }: { d: Details; high52: number | null; low52: number | null }) {
  const c = d.currency;
  const items = [
    d.marketCap != null && { label: "Capitalización", value: formatBig(d.marketCap, c), tip: "Lo que vale la empresa entera en bolsa: precio de la acción × número de acciones." },
    d.pe != null && {
      label: "PER",
      value: formatNumber(d.pe, 1),
      tip: "Precio / beneficio. Cuántos años de beneficios actuales pagas al comprar. Alto (más de 30) = el mercado espera mucho crecimiento o está cara; bajo (menos de 12) = barata o con problemas. El S&P 500 suele moverse entre 15 y 25.",
    },
    d.forwardPe != null && { label: "PER estimado", value: formatNumber(d.forwardPe, 1), tip: "Como el PER, pero usando los beneficios que los analistas esperan para el próximo año." },
    d.eps != null && { label: "Beneficio por acción", value: formatPrice(d.eps, c), tip: "Beneficio de los últimos 12 meses dividido entre el número de acciones (BPA o EPS)." },
    d.dividendYield != null && {
      label: "Rentab. por dividendo",
      value: formatPercent(d.dividendYield * 100, { sign: false }),
      tip: "Lo que la empresa reparte al año a sus accionistas, en % sobre el precio actual. Un 3 % significa 3 € al año por cada 100 € invertidos.",
    },
    d.beta != null && {
      label: "Beta",
      value: formatNumber(d.beta),
      tip: "Cuánto se mueve respecto al mercado. 1 = igual que el mercado; 1,5 = un 50 % más (más arriesgada); menos de 1 = más tranquila.",
    },
    high52 != null && low52 != null && {
      label: "Rango 52 semanas",
      value: `${formatPrice(low52)} – ${formatPrice(high52)}`,
      tip: "Precio mínimo y máximo del último año. Sirve para ver si cotiza cerca de máximos o de mínimos.",
    },
    d.avgVolume != null && { label: "Volumen medio", value: formatBig(d.avgVolume), tip: "Cuántas acciones se compran y venden de media al día (últimos 3 meses). Más volumen = más fácil comprar y vender." },
    d.priceToBook != null && { label: "Precio / valor contable", value: formatNumber(d.priceToBook), tip: "Compara el precio con lo que vale la empresa «en libros» (activos menos deudas). Menos de 1 puede indicar que está barata… o en apuros." },
    d.revenue != null && { label: "Ingresos (12 meses)", value: formatBig(d.revenue, c), tip: "Todo lo que la empresa ha facturado en el último año." },
    d.revenueGrowth != null && { label: "Crecimiento ingresos", value: formatPercent(d.revenueGrowth * 100), tip: "Cuánto han crecido las ventas respecto al mismo periodo del año anterior." },
    d.profitMargin != null && { label: "Margen de beneficio", value: formatPercent(d.profitMargin * 100, { sign: false }), tip: "De cada 100 € que ingresa, cuántos le quedan como beneficio." },
    d.debtToEquity != null && { label: "Deuda / patrimonio", value: `${formatNumber(d.debtToEquity, 0)} %`, tip: "Deuda en relación con el dinero de los accionistas. Por encima de 200 % es una empresa muy endeudada (salvo bancos y eléctricas, que suelen serlo)." },
  ].filter((x): x is { label: string; value: string; tip: string } => !!x);
  if (!items.length) return null;
  return (
    <dl className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
      {items.map((m) => (
        <Metric key={m.label} {...m} />
      ))}
    </dl>
  );
}

function Analysts({ d, price }: { d: Details; price: number | null }) {
  const t = d.trend;
  const total = t ? t.strongBuy + t.buy + t.hold + t.sell + t.strongSell : 0;
  if (!d.targetPrice && !total) return null;
  const bars = t
    ? [
        { label: "Comprar", n: t.strongBuy + t.buy, color: "bg-up" },
        { label: "Mantener", n: t.hold, color: "bg-muted/60" },
        { label: "Vender", n: t.sell + t.strongSell, color: "bg-down" },
      ]
    : [];
  const upside = d.targetPrice && price ? ((d.targetPrice - price) / price) * 100 : null;
  return (
    <Card>
      <CardTitle
        title={
          <>
            Qué opinan los analistas{" "}
            <InfoTip text="Analistas de bancos y casas de inversión publican su recomendación y el precio al que creen que llegará la acción en 12 meses. Se equivocan a menudo: tómalo como una opinión más." />
          </>
        }
      />
      <div className="grid gap-6 md:grid-cols-2">
        {total > 0 && (
          <div>
            <p className="mb-2 text-sm text-muted">{total} analistas este mes</p>
            <div className="mb-3 flex h-3 overflow-hidden rounded-full">
              {bars.map((b) => b.n > 0 && <span key={b.label} className={b.color} style={{ width: `${(b.n / total) * 100}%` }} />)}
            </div>
            <ul className="flex gap-4 text-sm">
              {bars.map((b) => (
                <li key={b.label} className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${b.color}`} />
                  {b.label} <strong>{b.n}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
        {d.targetPrice != null && (
          <div>
            <p className="text-sm text-muted">Precio objetivo medio</p>
            <p className="tabular text-2xl font-semibold">{formatPrice(d.targetPrice, d.currency)}</p>
            {upside != null && (
              <p className="text-sm">
                <Change pct={upside} /> <span className="text-muted">respecto al precio actual</span>
              </p>
            )}
            {d.recommendation && RECOMMENDATION[d.recommendation] && (
              <p className="mt-1 text-sm text-muted">
                Consenso: <strong className="text-text">{RECOMMENDATION[d.recommendation]}</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export default async function SymbolPage({ params, searchParams }: PageProps<"/valor/[symbol]">) {
  const user = await requireUser();
  const symbol = decodeURIComponent((await params).symbol).toUpperCase();
  const { r } = await searchParams;
  const range: RangeKey = isRange(r) ? r : "1A";

  const [quote, details, chart, weekly, watched] = await Promise.all([
    getQuote(symbol),
    getDetails(symbol),
    getChart(symbol, range),
    getChart(symbol, "5A"),
    isWatched(user.id, symbol),
  ]);
  if (!quote) notFound();

  const name = details?.name ?? quote.name;
  const [news, explainer] = await Promise.all([
    getNewsAbout(name, 10),
    aiEnabled() ? readNote(companyKey(symbol, todayKey())) : null,
  ]);
  const perf = returns(weekly, quote.price);
  const type = details?.type ?? quote.type;
  // Un índice no se puede comprar directamente.
  const canBuy = !symbol.startsWith("^") && type !== "INDEX";
  const hint = knownInstrument(symbol)?.hint;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="font-mono font-semibold text-text">{symbol}</span>
            {quote.exchange && <span>· {quote.exchange}</span>}
            {(details?.type ?? quote.type) && <Chip>{typeLabel(details?.type ?? quote.type)}</Chip>}
            {details?.sector && <Chip>{details.sector}</Chip>}
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          {hint && <p className="mt-1 max-w-2xl text-sm text-muted">{hint}</p>}
          <div className="mt-3 flex flex-wrap items-baseline gap-x-3">
            <span className="tabular text-4xl font-semibold">{priceLabel(symbol, details?.type ?? quote.type, quote.price, quote.currency)}</span>
            <Change pct={quote.changePct} abs={quote.change} arrow className="text-lg" />
            <span className="text-sm text-muted">hoy{quote.time ? ` · ${formatDateTime(quote.time)}` : ""}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <WatchButton symbol={symbol} name={name} watched={watched} />
          {canBuy && (
            <Link
              href={`/cartera?add=${encodeURIComponent(symbol)}#nueva-compra`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface-2 px-4 text-sm font-semibold hover:bg-border"
            >
              <Plus size={16} /> Añadir compra
            </Link>
          )}
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <div className="mb-3 flex justify-end">
              <Tabs
                items={(Object.keys(RANGES) as RangeKey[]).map((k) => ({ id: k, label: RANGE_LABELS[k], href: `/valor/${encodeURIComponent(symbol)}?r=${k}` }))}
                active={range}
              />
            </div>
            <PriceChart points={chart.points} base={chart.prevClose} range={range} />
          </Card>

          {perf.some((p) => p.pct != null) && (
            <Card>
              <CardTitle title={<>Rentabilidad <InfoTip text="Cuánto habría ganado o perdido el precio si hubieras comprado hace ese tiempo (sin contar dividendos)." /></>} />
              <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                {perf.map((p) => (
                  <div key={p.label} className="rounded-xl bg-surface-2/60 p-3 text-center">
                    <p className="text-xs text-muted">{p.label}</p>
                    <Change pct={p.pct} />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {details && (details.marketCap != null || details.pe != null) && (
            <Card>
              <CardTitle title="Datos clave" />
              <Fundamentals d={details} high52={quote.high52} low52={quote.low52} />
              {(details.nextEarnings || details.exDividend) && (
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                  {details.nextEarnings && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={15} className="text-accent" /> Próximos resultados: <strong>{formatDate(details.nextEarnings)}</strong>
                      <InfoTip text="El día que la empresa publica sus cuentas del trimestre. Suele haber movimientos fuertes en el precio ese día." />
                    </span>
                  )}
                  {details.exDividend && (
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={15} className="text-accent" /> Último ex-dividendo: <strong>{formatDate(details.exDividend)}</strong>
                      <InfoTip text="Para cobrar un dividendo hay que tener la acción antes de esta fecha." />
                    </span>
                  )}
                </div>
              )}
            </Card>
          )}

          {details && <Analysts d={details} price={quote.price} />}

          {aiEnabled() && (
            <Card>
              <CardTitle
                title={
                  <>
                    <Sparkles size={18} className="text-accent" /> Explícamelo fácil
                  </>
                }
              />
              <AiPanel
                action={explainCompanyAction.bind(null, symbol)}
                initial={explainer ? { text: explainer.content, at: explainer.createdAt.toISOString() } : undefined}
                cta={`¿Qué es ${name} y cómo leo sus números?`}
                waiting="Preparando la explicación…"
                allowRefresh={false}
              />
            </Card>
          )}

          {details?.summary && (
            <Card>
              <CardTitle title="Sobre la empresa" />
              <details className="group text-sm leading-relaxed text-muted">
                <summary className="cursor-pointer list-none">
                  <span className="line-clamp-4 group-open:line-clamp-none">{details.summary}</span>
                  <span className="mt-1 inline-block text-accent group-open:hidden">Leer más (en inglés)</span>
                </summary>
              </details>
              <p className="mt-3 flex flex-wrap gap-x-4 text-sm text-muted">
                {details.industry && <span>Industria: {details.industry}</span>}
                {details.country && <span>País: {details.country}</span>}
                {details.employees && <span>Empleados: {formatNumber(details.employees, 0)}</span>}
                {details.website && (
                  <a href={details.website} target="_blank" rel="noopener noreferrer" className="text-accent">
                    Web oficial
                  </a>
                )}
              </p>
            </Card>
          )}
        </div>

        <div>
          <Card className="xl:sticky xl:top-24">
            <CardTitle title="Noticias" />
            <NewsList items={news} withImages={false} />
          </Card>
        </div>
      </div>
    </>
  );
}
