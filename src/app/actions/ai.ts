"use server";

import { AiError, aiEnabled, briefKey, companyKey, generateBrief, generateCompanyExplainer, readNote } from "@/lib/ai";
import { requireUser } from "@/lib/dal";
import { formatBig, formatNumber, formatPercent, formatPrice, longToday, todayKey } from "@/lib/format";
import { HEADLINE_SYMBOLS, MARKET_GROUPS } from "@/lib/market/catalog";
import { getNews, getNewsAbout } from "@/lib/market/news";
import { getDetails, getMovers, getQuote, getQuotes, type Quote } from "@/lib/market/yahoo";
import { getWatchlist } from "@/lib/queries";

export type AiState = { text?: string; error?: string; at?: string } | undefined;

// Evita regenerar (y pagar) el mismo texto varias veces seguidas.
const MIN_AGE_MS = 20 * 60_000;

const line = (q: Quote) => `- ${q.name} (${q.symbol}): ${formatPrice(q.price, q.currency)} · ${formatPercent(q.changePct)} hoy`;

export async function generateBriefAction(): Promise<AiState> {
  const me = await requireUser();
  if (!aiEnabled()) return { error: "Falta configurar ANTHROPIC_API_KEY en Vercel." };
  const key = briefKey(me.id, todayKey());
  const existing = await readNote(key);
  if (existing && Date.now() - existing.createdAt.getTime() < MIN_AGE_MS) {
    return { text: existing.content, at: existing.createdAt.toISOString() };
  }

  try {
    const groups = ["eeuu", "europa", "mundo", "cripto", "divisas", "materias", "bonos"];
    const symbols = MARKET_GROUPS.filter((g) => groups.includes(g.id)).flatMap((g) => g.items.map((i) => i.symbol));
    const watch = await getWatchlist(me.id);
    const [markets, gainers, losers, watchQuotes, news] = await Promise.all([
      getQuotes([...new Set([...HEADLINE_SYMBOLS, ...symbols])]),
      getMovers("day_gainers", 6),
      getMovers("day_losers", 6),
      getQuotes(watch.map((w) => w.symbol)),
      getNews("todas", 40),
    ]);
    const text = await generateBrief(key, {
      date: longToday(),
      markets: markets.map(line).join("\n"),
      movers: [
        "Suben más:",
        ...gainers.map((m) => `- ${m.name} (${m.symbol}): ${formatPercent(m.changePct)}`),
        "Bajan más:",
        ...losers.map((m) => `- ${m.name} (${m.symbol}): ${formatPercent(m.changePct)}`),
      ].join("\n"),
      watchlist: watchQuotes.map(line).join("\n"),
      news: news.map((n) => `- [${n.source}] ${n.title}${n.summary ? ` — ${n.summary}` : ""}`).join("\n"),
    });
    return { text, at: new Date().toISOString() };
  } catch (err) {
    console.error("Error generando el resumen", err);
    return { error: err instanceof AiError ? err.message : "No se ha podido generar el resumen. Inténtalo de nuevo en unos minutos." };
  }
}

export async function explainCompanyAction(symbol: string): Promise<AiState> {
  await requireUser();
  if (!aiEnabled()) return { error: "Falta configurar ANTHROPIC_API_KEY en Vercel." };
  const key = companyKey(symbol, todayKey());
  const existing = await readNote(key);
  if (existing) return { text: existing.content, at: existing.createdAt.toISOString() };

  try {
    const [d, q] = await Promise.all([getDetails(symbol), getQuote(symbol)]);
    if (!d && !q) return { error: "No hay datos de este valor." };
    const name = d?.name ?? q?.name ?? symbol;
    const news = await getNewsAbout(name, 10);
    const facts = [
      `Símbolo: ${symbol}`,
      d?.type && `Tipo: ${d.type}`,
      d?.sector && `Sector: ${d.sector} / ${d.industry}`,
      d?.country && `País: ${d.country}`,
      q && `Precio: ${formatPrice(q.price, q.currency)} (${formatPercent(q.changePct)} hoy)`,
      q?.high52 && `Rango 52 semanas: ${formatPrice(q.low52)} – ${formatPrice(q.high52)}`,
      d?.marketCap && `Capitalización: ${formatBig(d.marketCap, d.currency)}`,
      d?.pe && `PER: ${formatNumber(d.pe, 1)}`,
      d?.forwardPe && `PER estimado: ${formatNumber(d.forwardPe, 1)}`,
      d?.dividendYield != null && `Rentabilidad por dividendo: ${formatPercent(d.dividendYield * 100, { sign: false })}`,
      d?.beta && `Beta: ${formatNumber(d.beta)}`,
      d?.revenue && `Ingresos anuales: ${formatBig(d.revenue, d.currency)}`,
      d?.revenueGrowth != null && `Crecimiento de ingresos: ${formatPercent(d.revenueGrowth * 100)}`,
      d?.profitMargin != null && `Margen de beneficio: ${formatPercent(d.profitMargin * 100, { sign: false })}`,
      d?.debtToEquity && `Deuda/patrimonio: ${formatNumber(d.debtToEquity, 0)} %`,
      d?.targetPrice && `Precio objetivo medio de analistas: ${formatPrice(d.targetPrice, d.currency)} (${d.analysts} analistas, consenso «${d.recommendation}»)`,
      d?.nextEarnings && `Próximos resultados: ${d.nextEarnings.slice(0, 10)}`,
      d?.summary && `Descripción (inglés): ${d.summary}`,
    ]
      .filter(Boolean)
      .join("\n");
    const text = await generateCompanyExplainer(key, {
      name,
      facts,
      news: news.map((n) => `- [${n.source}] ${n.title}`).join("\n"),
    });
    return { text, at: new Date().toISOString() };
  } catch (err) {
    console.error("Error generando la explicación", err);
    return { error: err instanceof AiError ? err.message : "No se ha podido generar la explicación. Inténtalo de nuevo en unos minutos." };
  }
}
