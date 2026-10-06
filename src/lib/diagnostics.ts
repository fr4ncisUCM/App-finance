import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { aiEnabled } from "./ai";
import { SOURCES } from "./market/news";
import { UA, yf } from "./market/yahoo";

export type Check = { group: string; name: string; ok: boolean; ms: number; detail: string };

async function run(group: string, name: string, fn: () => Promise<string>): Promise<Check> {
  const t = Date.now();
  try {
    const detail = await Promise.race([
      fn(),
      new Promise<string>((_, reject) => setTimeout(() => reject(new Error("Tiempo de espera agotado (10 s)")), 10_000)),
    ]);
    return { group, name, ok: true, ms: Date.now() - t, detail };
  } catch (err) {
    const e = err as Error & { cause?: Error };
    return { group, name, ok: false, ms: Date.now() - t, detail: (e.cause?.message ?? e.message ?? String(err)).slice(0, 240) };
  }
}

async function getStatus(url: string) {
  const res = await fetch(url, { headers: UA, cache: "no-store" });
  const body = await res.text();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body.slice(0, 120)}`);
  return body;
}

/** Comprueba, sin caché, cada fuente de datos que usa la app desde el servidor donde está desplegada. */
export async function runDiagnostics(): Promise<Check[]> {
  return Promise.all([
    run("App", "Base de datos", async () => {
      await db.execute(sql`select 1 from users limit 1`);
      return "Conectada";
    }),
    run("App", "IA (ANTHROPIC_API_KEY)", async () => {
      if (!aiEnabled()) throw new Error("No configurada (opcional)");
      return "Configurada";
    }),
    run("Cotizaciones", "Yahoo spark (query1)", async () => {
      const b = await getStatus("https://query1.finance.yahoo.com/v7/finance/spark?symbols=%5EGSPC&range=1d&interval=15m");
      if (!b.includes("regularMarketPrice")) throw new Error(`Respuesta inesperada: ${b.slice(0, 120)}`);
      return "OK";
    }),
    run("Cotizaciones", "Yahoo spark (query2)", async () => {
      const b = await getStatus("https://query2.finance.yahoo.com/v7/finance/spark?symbols=%5EGSPC&range=1d&interval=15m");
      if (!b.includes("regularMarketPrice")) throw new Error(`Respuesta inesperada: ${b.slice(0, 120)}`);
      return "OK";
    }),
    run("Cotizaciones", "Yahoo chart", async () => {
      const b = await getStatus("https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=5d&interval=1d");
      if (!b.includes("timestamp")) throw new Error(`Respuesta inesperada: ${b.slice(0, 120)}`);
      return "OK";
    }),
    run("Cotizaciones", "Yahoo quote (respaldo con cookie)", async () => {
      const q = await yf.quote("^GSPC", {}, { validateResult: false });
      return `S&P 500 = ${q?.regularMarketPrice}`;
    }),
    run("Cotizaciones", "Yahoo ficha (quoteSummary)", async () => {
      const s = await yf.quoteSummary("AAPL", { modules: ["summaryDetail"] });
      return `PER Apple = ${s.summaryDetail?.trailingPE?.toFixed(1)}`;
    }),
    run("Cotizaciones", "Yahoo lo que se mueve (screener)", async () => {
      const r = await yf.screener({ scrIds: "day_gainers", count: 3 });
      return `${r.quotes.length} valores`;
    }),
    run("Cotizaciones", "Yahoo buscador", async () => {
      const r = await yf.search("apple", { quotesCount: 3, newsCount: 0 });
      return `${r.quotes.length} resultados`;
    }),
    ...SOURCES.map((s) =>
      run("Noticias", s.url.includes("news.google.com") ? `${s.name} (${s.category})` : s.name + (s.category === "economia" ? " (economía)" : ""), async () => {
        const b = await getStatus(s.url);
        const items = (b.match(/<item[\s>]/g) ?? []).length;
        if (!items) throw new Error("Sin noticias en la respuesta");
        return `${items} noticias`;
      }),
    ),
  ]);
}
