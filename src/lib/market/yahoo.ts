import "server-only";
import { unstable_cache } from "next/cache";
import YahooFinance from "yahoo-finance2";
import { knownInstrument } from "./catalog";

// Datos de mercado gratuitos de Yahoo Finance (con ~15 min de retraso en algunas bolsas).
// Las peticiones se cachean unos segundos/minutos para no saturar la fuente y que la app vaya rápida.

export const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126 Safari/537.36" };

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

async function fetchSpark(chunk: string[]): Promise<Quote[]> {
  const qs = `symbols=${encodeURIComponent(chunk.join(","))}&range=1d&interval=15m&includePrePost=false`;
  let lastError: unknown;
  for (const host of ["query1", "query2"]) {
    try {
      const res = await fetch(`https://${host}.finance.yahoo.com/v7/finance/spark?${qs}`, { headers: UA, next: { revalidate: 60 } });
      if (!res.ok) throw new Error(`spark ${host} HTTP ${res.status}`);
      const data = (await res.json()) as SparkResponse;
      const result = data.spark?.result ?? [];
      if (!result.length) throw new Error(`spark ${host} sin resultados`);
      return result.flatMap((r) => {
        const item = r.response?.[0];
        if (!item) return [];
        const m = item.meta;
        const price = num(m.regularMarketPrice);
        const prev = num(m.previousClose) ?? num(m.chartPreviousClose);
        const change = price != null && prev != null ? price - prev : null;
        return [
          {
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
          },
        ];
      });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/**
 * Respaldo: la API «quote» con cookie y crumb (lo gestiona yahoo-finance2).
 * Yahoo a veces bloquea las peticiones anónimas desde servidores en la nube; esta vía suele funcionar.
 * No trae minigráfico.
 */
const quoteFallback = unstable_cache(
  async (chunk: string[]): Promise<Quote[]> => {
    const rows = await yf.quote(chunk, {}, { validateResult: false });
    return (Array.isArray(rows) ? rows : [rows]).map((q) => {
      const x = q as Record<string, unknown>;
      const time = x.regularMarketTime instanceof Date ? x.regularMarketTime.getTime() : null;
      return {
        symbol: q.symbol,
        name: knownInstrument(q.symbol)?.name ?? (x.shortName as string) ?? (x.longName as string) ?? q.symbol,
        price: num(x.regularMarketPrice),
        change: num(x.regularMarketChange),
        changePct: num(x.regularMarketChangePercent),
        prevClose: num(x.regularMarketPreviousClose),
        currency: (x.currency as string) ?? null,
        dayHigh: num(x.regularMarketDayHigh),
        dayLow: num(x.regularMarketDayLow),
        high52: num(x.fiftyTwoWeekHigh),
        low52: num(x.fiftyTwoWeekLow),
        volume: num(x.regularMarketVolume),
        time,
        exchange: (x.fullExchangeName as string) ?? null,
        type: (x.quoteType as string) ?? null,
        spark: [],
      };
    });
  },
  ["quote-fallback-v1"],
  { revalidate: 60 },
);

/** Cotización + minigráfico del día para una lista de símbolos (hasta 20 por llamada). */
export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  const unique = [...new Set(symbols)];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += 20) chunks.push(unique.slice(i, i + 20));

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      try {
        return await fetchSpark(chunk);
      } catch (sparkErr) {
        try {
          return await quoteFallback(chunk);
        } catch (err) {
          console.error("Error obteniendo cotizaciones", chunk, sparkErr, err);
          return [];
        }
      }
    }),
  );

  const bySymbol = new Map(results.flat().map((q) => [q.symbol, q]));
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

const RANGE_DAYS: Record<RangeKey, number> = { "1D": 5, "5D": 7, "1M": 31, "6M": 183, YTD: 0, "1A": 366, "5A": 5 * 366, MAX: 60 * 366 };

const chartFallback = unstable_cache(
  async (symbol: string, rangeKey: RangeKey): Promise<ChartData> => {
    const { interval } = RANGES[rangeKey];
    const period1 =
      rangeKey === "YTD" ? new Date(new Date().getFullYear(), 0, 1) : new Date(Date.now() - RANGE_DAYS[rangeKey] * 86400_000);
    const r = await yf.chart(symbol, { period1, interval: interval as "1d", includePrePost: false });
    let points = r.quotes
      .filter((q) => typeof q.close === "number")
      .map((q) => ({ t: new Date(q.date).getTime(), c: q.close as number }));
    // Para «1 día» se queda solo con la última sesión.
    if (rangeKey === "1D" && points.length) {
      const last = points[points.length - 1].t;
      points = points.filter((p) => last - p.t < 16 * 3600_000);
    }
    return {
      points,
      prevClose: rangeKey === "1D" ? num(r.meta.previousClose) ?? num(r.meta.chartPreviousClose) : null,
      currency: r.meta.currency ?? null,
    };
  },
  ["chart-fallback-v1"],
  { revalidate: 300 },
);

/** Serie histórica de precios de cierre. */
export async function getChart(symbol: string, rangeKey: RangeKey): Promise<ChartData> {
  const { range, interval } = RANGES[rangeKey];
  const qs = `range=${range}&interval=${interval}&includePrePost=false`;
  for (const host of ["query1", "query2"]) {
    try {
      const res = await fetch(`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${qs}`, {
        headers: UA,
        next: { revalidate: rangeKey === "1D" || rangeKey === "5D" ? 60 : 1800 },
      });
      if (!res.ok) throw new Error(`chart HTTP ${res.status}`);
      const data = await res.json();
      const r = data?.chart?.result?.[0];
      const ts: number[] = r?.timestamp ?? [];
      const closes: (number | null)[] = r?.indicators?.quote?.[0]?.close ?? [];
      const points = ts
        .map((t, i) => ({ t: t * 1000, c: closes[i] }))
        .filter((p): p is { t: number; c: number } => typeof p.c === "number");
      if (!points.length) throw new Error("chart sin datos");
      return {
        points,
        prevClose: rangeKey === "1D" ? num(r?.meta?.chartPreviousClose) ?? num(r?.meta?.previousClose) : null,
        currency: r?.meta?.currency ?? null,
      };
    } catch {
      /* se prueba el siguiente host o el respaldo */
    }
  }
  try {
    return await chartFallback(symbol, rangeKey);
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
const detailsCached = unstable_cache(
  async (symbol: string): Promise<Details | null> => {
    const q = await yf.quote(symbol, {}, { validateResult: false });
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
  },
  ["details-v2"],
  { revalidate: 900 },
);

// Los fallos no se guardan en caché: así, si Yahoo falla un momento, se reintenta en la siguiente visita.
export async function getDetails(symbol: string) {
  try {
    return await detailsCached(symbol);
  } catch (err) {
    console.error("Error obteniendo ficha", symbol, err);
    return null;
  }
}

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

const searchCached = unstable_cache(
  async (query: string): Promise<SearchResult[]> => {
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
  },
  ["search-v2"],
  { revalidate: 86400 },
);

export async function searchSymbols(query: string) {
  try {
    return await searchCached(query);
  } catch (err) {
    console.error("Error buscando", query, err);
    return [];
  }
}

export type Mover = { symbol: string; name: string; price: number | null; changePct: number | null; currency: string | null; volume: number | null; marketCap: number | null };

type MoverKind = "day_gainers" | "day_losers" | "most_actives";

const moversCached = unstable_cache(
  async (kind: MoverKind, count: number): Promise<Mover[]> => {
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
  },
  ["movers-v2"],
  { revalidate: 300 },
);

/** Acciones de EE. UU. que más suben, bajan o se negocian hoy. */
export async function getMovers(kind: MoverKind, count = 15) {
  try {
    return await moversCached(kind, count);
  } catch (err) {
    console.error("Error obteniendo movimientos", kind, err);
    return [];
  }
}

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
