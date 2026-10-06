import "server-only";
import { unstable_cache } from "next/cache";
import YahooFinance from "yahoo-finance2";
import { knownInstrument } from "./catalog";

// Datos de mercado gratuitos de Yahoo Finance (con ~15 min de retraso en algunas bolsas).
// Las peticiones se cachean unos segundos/minutos para no saturar la fuente y que la app vaya rápida.

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36" };

export type Quote = {
  symbol: string;
  name: string;
  price: number | null;
  change: number | null;
  changePct: number | null;
  prevClose: number | null;
  currency: string | null;
  dayHigh: number | null;
  dayLow: number | null;
  high52: number | null;
  low52: number | null;
  volume: number | null;
  /** Hora de la última cotización (ms). */
  time: number | null;
  exchange: string | null;
  type: string | null;
  /** Precios del día para el minigráfico. */
  spark: number[];
};

type SparkMeta = {
  symbol: string;
  currency?: string;
  regularMarketPrice?: number;
  previousClose?: number;
  chartPreviousClose?: number;
  regularMarketDayHigh?: number;
  regularMarketDayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  regularMarketVolume?: number;
  regularMarketTime?: number;
  fullExchangeName?: string;
  instrumentType?: string;
  longName?: string;
  shortName?: string;
};

type SparkResponse = {
  spark?: {
    result?: { symbol: string; response: { meta: SparkMeta; indicators: { quote: { close: (number | null)[] }[] } }[] }[];
  };
};

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);

/**
 * Cotización + minigráfico del día para una lista de símbolos.
 * Usa el endpoint «spark» (hasta 20 símbolos por llamada), que no necesita credenciales.
 */
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const unique = [...new Set(symbols)];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 20) chunks.push(unique.slice(i, i + 20));

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        const url = `https://query1.finance.yahoo.com/v7/finance/spark?symbols=${encodeURIComponent(chunk.join(","))}&range=1d&interval=15m&includePrePost=false`;
        const res = await fetch(url, { headers: UA, next: { revalidate: 60 } });
        if (!res.ok) throw new Error(`spark ${res.status}`);
        const data = (await res.json()) as SparkResponse;
        return data.spark?.result ?? [];
      } catch (err) {
        console.error("Error obteniendo cotizaciones", chunk, err);
        return [];
      }
    }),
  );

  const bySymbol = new Map<string, Quote>();
  for (const r of results.flat()) {
    const item = r.response?.[0];
    if (!item) continue;
    const m = item.meta;
    const price = num(m.regularMarketPrice);
    const prev = num(m.previousClose) ?? num(m.chartPreviousClose);
    const change = price != null && prev != null ? price - prev : null;
    bySymbol.set(r.symbol, {
      symbol: r.symbol,
      name: knownInstrument(r.symbol)?.name ?? m.shortName ?? m.longName ?? r.symbol,
      price,
      change,
      changePct: change != null && prev ? (change / prev) * 100 : null,
      prevClose: prev,
      currency: m.currency ?? null,
      dayHigh: num(m.regularMarketDayHigh),
      dayLow: num(m.regularMarketDayLow),
      high52: num(m.fiftyTwoWeekHigh),
      low52: num(m.fiftyTwoWeekLow),
      volume: num(m.regularMarketVolume),
      time: m.regularMarketTime ? m.regularMarketTime * 1000 : null,
      exchange: m.fullExchangeName ?? null,
      type: m.instrumentType ?? null,
      spark: (item.indicators?.quote?.[0]?.close ?? []).filter((v): v is number => typeof v === "number"),
    });
  }
  // Mantiene el orden pedido.
  return unique.map((s) => bySymbol.get(s)).filter((q): q is Quote => !!q);
}

export async function getQuote(symbol: string) {
  return (await getQuotes([symbol]))[0] ?? null;
}

export const RANGES = {
  "1D": { range: "1d", interval: "5m" },
  "5D": { range: "5d", interval: "15m" },
  "1M": { range: "1mo", interval: "60m" },
  "6M": { range: "6mo", interval: "1d" },
  "YTD": { range: "ytd", interval: "1d" },
  "1A": { range: "1y", interval: "1d" },
  "5A": { range: "5y", interval: "1wk" },
  "MAX": { range: "max", interval: "1mo" },
} as const;

export type RangeKey = keyof typeof RANGES;

export function isRange(v: unknown): v is RangeKey {
  return typeof v === "string" && v in RANGES;
}

export type ChartData = { points: { t: number; c: number }[]; prevClose: number | null; currency: string | null };

/** Serie histórica de precios de cierre. */
export async function getChart(symbol: string, rangeKey: RangeKey): Promise<ChartData> {
  const { range, interval } = RANGES[rangeKey];
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;
    const res = await fetch(url, { headers: UA, next: { revalidate: rangeKey === "1D" || rangeKey === "5D" ? 60 : 1800 } });
    if (!res.ok) throw new Error(`chart ${res.status}`);
    const data = await res.json();
    const r = data?.chart?.result?.[0];
    const ts: number[] = r?.timestamp ?? [];
    const closes: (number | null)[] = r?.indicators?.quote?.[0]?.close ?? [];
    const points = ts
      .map((t, i) => ({ t: t * 1000, c: closes[i] }))
      .filter((p): p is { t: number; c: number } => typeof p.c === "number");
    return {
      points,
      prevClose: rangeKey === "1D" ? num(r?.meta?.chartPreviousClose) ?? num(r?.meta?.previousClose) : null,
      currency: r?.meta?.currency ?? null,
    };
  } catch (err) {
    console.error("Error obteniendo gráfico", symbol, rangeKey, err);
    return { points: [], prevClose: null, currency: null };
  }
}

export type Details = {
  symbol: string;
  name: string;
  type: string | null;
  exchange: string | null;
  currency: string | null;
  marketState: string | null;
  marketCap: number | null;
  pe: number | null;
  forwardPe: number | null;
  eps: number | null;
  dividendYield: number | null;
  beta: number | null;
  avgVolume: number | null;
  priceToBook: number | null;
  sector: string | null;
  industry: string | null;
  country: string | null;
  website: string | null;
  employees: number | null;
  summary: string | null;
  targetPrice: number | null;
  recommendation: string | null;
  analysts: number | null;
  revenue: number | null;
  revenueGrowth: number | null;
  profitMargin: number | null;
  debtToEquity: number | null;
  nextEarnings: string | null;
  exDividend: string | null;
  trend: { strongBuy: number; buy: number; hold: number; sell: number; strongSell: number } | null;
};

const iso = (d: unknown) => (d instanceof Date && !Number.isNaN(d.getTime()) ? d.toISOString() : null);

/** Ficha completa de un valor: métricas, perfil de la empresa y opinión de analistas. */
export const getDetails = unstable_cache(
  async (symbol: string): Promise<Details | null> => {
    try {
      const q = await yf.quote(symbol);
      if (!q) return null;
      const isEquity = q.quoteType === "EQUITY";
      const isFund = q.quoteType === "ETF" || q.quoteType === "MUTUALFUND";
      const modules = isEquity
        ? (["assetProfile", "summaryDetail", "defaultKeyStatistics", "financialData", "calendarEvents", "recommendationTrend"] as const)
        : isFund
          ? (["summaryDetail", "defaultKeyStatistics"] as const)
          : null;
      const s = modules ? await yf.quoteSummary(symbol, { modules: [...modules] }).catch(() => null) : null;
      const trend = s?.recommendationTrend?.trend?.find((t) => t.period === "0m") ?? null;
      const qq = q as Record<string, unknown>;

      return {
        symbol: q.symbol,
        name: knownInstrument(symbol)?.name ?? q.longName ?? q.shortName ?? symbol,
        type: q.quoteType ?? null,
        exchange: q.fullExchangeName ?? null,
        currency: q.currency ?? null,
        marketState: q.marketState ?? null,
        marketCap: num(qq.marketCap),
        pe: num(qq.trailingPE),
        forwardPe: num(qq.forwardPE),
        eps: num(qq.epsTrailingTwelveMonths),
        dividendYield: num(s?.summaryDetail?.dividendYield) ?? num(s?.summaryDetail?.yield) ?? num(qq.trailingAnnualDividendYield),
        beta: num(s?.summaryDetail?.beta) ?? num(s?.defaultKeyStatistics?.beta),
        avgVolume: num(qq.averageDailyVolume3Month),
        priceToBook: num(qq.priceToBook) ?? num(s?.defaultKeyStatistics?.priceToBook),
        sector: s?.assetProfile?.sector ?? null,
        industry: s?.assetProfile?.industry ?? null,
        country: s?.assetProfile?.country ?? null,
        website: s?.assetProfile?.website ?? null,
        employees: num(s?.assetProfile?.fullTimeEmployees),
        summary: s?.assetProfile?.longBusinessSummary ?? null,
        targetPrice: num(s?.financialData?.targetMeanPrice),
        recommendation: s?.financialData?.recommendationKey ?? null,
        analysts: num(s?.financialData?.numberOfAnalystOpinions),
        revenue: num(s?.financialData?.totalRevenue),
        revenueGrowth: num(s?.financialData?.revenueGrowth),
        profitMargin: num(s?.financialData?.profitMargins),
        debtToEquity: num(s?.financialData?.debtToEquity),
        nextEarnings: iso(s?.calendarEvents?.earnings?.earningsDate?.[0]),
        exDividend: iso(s?.calendarEvents?.exDividendDate),
        trend: trend
          ? { strongBuy: trend.strongBuy, buy: trend.buy, hold: trend.hold, sell: trend.sell, strongSell: trend.strongSell }
          : null,
      };
    } catch (err) {
      console.error("Error obteniendo ficha", symbol, err);
      return null;
    }
  },
  ["details-v1"],
  { revalidate: 900 },
);

export type SearchResult = { symbol: string; name: string; exchange: string | null; type: string | null };

const TYPE_LABELS: Record<string, string> = {
  EQUITY: "Acción",
  ETF: "ETF",
  INDEX: "Índice",
  CRYPTOCURRENCY: "Cripto",
  CURRENCY: "Divisa",
  FUTURE: "Futuro",
  MUTUALFUND: "Fondo",
};

export function typeLabel(type: string | null | undefined) {
  return type ? (TYPE_LABELS[type] ?? type) : "";
}

export const searchSymbols = unstable_cache(
  async (query: string): Promise<SearchResult[]> => {
    try {
      const r = await yf.search(query, { quotesCount: 12, newsCount: 0 });
      return r.quotes
        .filter((q): q is typeof q & { symbol: string } => "symbol" in q && typeof q.symbol === "string" && q.isYahooFinance === true)
        .map((q) => {
          const x = q as Record<string, unknown>;
          return {
            symbol: q.symbol,
            name: String(x.longname ?? x.shortname ?? q.symbol),
            exchange: (x.exchDisp as string) ?? null,
            type: (x.quoteType as string) ?? null,
          };
        });
    } catch (err) {
      console.error("Error buscando", query, err);
      return [];
    }
  },
  ["search-v1"],
  { revalidate: 86400 },
);

export type Mover = { symbol: string; name: string; price: number | null; changePct: number | null; currency: string | null; volume: number | null; marketCap: number | null };

/** Acciones de EE. UU. que más suben, bajan o se negocian hoy. */
export const getMovers = unstable_cache(
  async (kind: "day_gainers" | "day_losers" | "most_actives", count = 15): Promise<Mover[]> => {
    try {
      const r = await yf.screener({ scrIds: kind, count });
      return r.quotes.map((q) => ({
        symbol: q.symbol,
        name: q.shortName ?? q.longName ?? q.symbol,
        price: num(q.regularMarketPrice),
        changePct: num(q.regularMarketChangePercent),
        currency: q.currency ?? null,
        volume: num(q.regularMarketVolume),
        marketCap: num(q.marketCap),
      }));
    } catch (err) {
      console.error("Error obteniendo movimientos", kind, err);
      return [];
    }
  },
  ["movers-v1"],
  { revalidate: 300 },
);

/** Tipo de cambio para pasar importes de `from` a `to` (p. ej. USD → EUR). */
export async function getFxRates(currencies: string[], to: string): Promise<Map<string, number>> {
  const rates = new Map<string, number>([[to, 1]]);
  const needed = [...new Set(currencies.map((c) => (c === "GBp" ? "GBP" : c)))].filter((c) => c !== to);
  if (needed.length) {
    const quotes = await getQuotes(needed.map((c) => `${c}${to}=X`));
    for (const q of quotes) if (q.price) rates.set(q.symbol.slice(0, 3), q.price);
  }
  // Las acciones de Londres cotizan en peniques.
  if (rates.has("GBP")) rates.set("GBp", rates.get("GBP")! / 100);
  return rates;
}
