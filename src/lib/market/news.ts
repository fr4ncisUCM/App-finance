import "server-only";
import { XMLParser } from "fast-xml-parser";

// Noticias de medios financieros a través de sus RSS públicos.

export type NewsCategory = "mercados" | "economia" | "internacional" | "cripto";

export const NEWS_CATEGORIES: { id: NewsCategory | "todas"; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "mercados", label: "Mercados" },
  { id: "internacional", label: "Internacional" },
  { id: "economia", label: "Economía" },
  { id: "cripto", label: "Cripto" },
];

type Source = { name: string; url: string; category: NewsCategory; lang: "es" | "en" };

export const SOURCES: Source[] = [
  { name: "Expansión", url: "https://e00-expansion.uecdn.es/rss/mercados.xml", category: "mercados", lang: "es" },
  { name: "Investing.com", url: "https://es.investing.com/rss/news.rss", category: "mercados", lang: "es" },
  { name: "Cinco Días", url: "https://feeds.elpais.com/mrss-s/pages/ep/site/cincodias.elpais.com/portada", category: "economia", lang: "es" },
  { name: "Expansión", url: "https://e00-expansion.uecdn.es/rss/economia.xml", category: "economia", lang: "es" },
  { name: "MarketWatch", url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", category: "internacional", lang: "en" },
  { name: "BBC Business", url: "https://feeds.bbci.co.uk/news/business/rss.xml", category: "internacional", lang: "en" },
  {
    name: "Google Noticias",
    url: "https://news.google.com/rss/search?q=wall+street+bolsa+when:1d&hl=es&gl=ES&ceid=ES:es",
    category: "internacional",
    lang: "es",
  },
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", category: "cripto", lang: "en" },
  {
    name: "Google Noticias",
    url: "https://news.google.com/rss/search?q=bitcoin+OR+criptomonedas+when:2d&hl=es&gl=ES&ceid=ES:es",
    category: "cripto",
    lang: "es",
  },
];

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  date: string | null;
  summary: string | null;
  image: string | null;
  lang: "es" | "en";
  category: NewsCategory;
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  htmlEntities: true,
  textNodeName: "#text",
});

const ENTITIES: Record<string, string> = { "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&#39;": "'", "&apos;": "'", "&lt;": "<", "&gt;": ">" };

function cleanText(value: unknown): string {
  const raw = typeof value === "object" && value !== null ? (value as Record<string, unknown>)["#text"] : value;
  if (raw == null) return "";
  return String(raw)
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, (e) => ENTITIES[e] ?? " ")
    .replace(/\s*Leer\s*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function firstImage(item: Record<string, unknown>): string | null {
  const pick = (v: unknown): string | null => {
    const x = Array.isArray(v) ? v[0] : v;
    if (x && typeof x === "object" && "@_url" in x) return String((x as Record<string, unknown>)["@_url"]);
    return null;
  };
  return pick(item["media:thumbnail"]) ?? pick(item["media:content"]) ?? pick(item.enclosure);
}

function parseDate(value: unknown): string | null {
  if (!value) return null;
  const d = new Date(String(value).replace(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/, "$1T$2Z"));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function fetchFeed(source: Source, revalidate = 600): Promise<NewsItem[]> {
  try {
    const res = await fetch(source.url, {
      headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36" },
      next: { revalidate },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = parser.parse(await res.text());
    const items = xml?.rss?.channel?.item;
    const list: Record<string, unknown>[] = Array.isArray(items) ? items : items ? [items] : [];
    return list.slice(0, 30).map((item) => {
      let title = cleanText(item.title);
      let sourceName = source.name;
      // Google Noticias pone el medio al final del título: «Titular - Medio».
      if (source.url.includes("news.google.com")) {
        const src = cleanText(item.source);
        if (src) {
          sourceName = src;
          title = title.replace(new RegExp(`\\s+-\\s+${src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "");
        }
      }
      const link = cleanText(item.link) || cleanText(item.guid);
      const summary = source.url.includes("news.google.com") ? "" : cleanText(item.description);
      return {
        id: link,
        title,
        link,
        source: sourceName,
        date: parseDate(item.pubDate),
        summary: summary && summary !== title ? summary.slice(0, 320) : null,
        image: firstImage(item),
        lang: source.lang,
        category: source.category,
      };
    });
  } catch (err) {
    console.error("Error leyendo RSS", source.url, err);
    return [];
  }
}

function dedupeAndSort(items: NewsItem[]) {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of items) {
    const key = item.title.toLowerCase().slice(0, 80);
    if (!item.title || !item.link || seen.has(key) || seen.has(item.link)) continue;
    seen.add(key);
    seen.add(item.link);
    out.push(item);
  }
  return out.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

export async function getNews(category: NewsCategory | "todas" = "todas", limit = 60): Promise<NewsItem[]> {
  const sources = category === "todas" ? SOURCES : SOURCES.filter((s) => s.category === category);
  const all = await Promise.all(sources.map((s) => fetchFeed(s)));
  // No mostrar noticias de más de 4 días.
  const cutoff = new Date(Date.now() - 4 * 86400_000).toISOString();
  // Cada fuente aporta como mucho su parte, para que una que publica mucho no tape al resto.
  const perSource = Math.max(4, Math.ceil((limit * 1.5) / sources.length));
  const lists = all.map((items) => dedupeAndSort(items.filter((n) => !n.date || n.date > cutoff)).slice(0, perSource));
  // Se intercalan las fuentes (la más reciente de cada una, luego la segunda…) para que haya variedad arriba.
  const mixed: NewsItem[] = [];
  for (let i = 0; i < perSource; i++) {
    const round = lists.map((l) => l[i]).filter((n): n is NewsItem => !!n);
    mixed.push(...round.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "")));
  }
  const seen = new Set<string>();
  return mixed
    .filter((n) => {
      const key = n.title.toLowerCase().slice(0, 80);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);
}

/** Noticias recientes sobre una empresa o activo concreto (Google Noticias en español). */
export async function getNewsAbout(name: string, limit = 12): Promise<NewsItem[]> {
  const clean = name.replace(/\b(Inc\.?|Corp\.?|Corporation|S\.A\.|SA|plc|N\.V\.|Ltd\.?|Class [A-C]|USD)\b/gi, "").replace(/[,()]/g, " ").trim();
  const q = encodeURIComponent(`"${clean}" when:7d`);
  const items = await fetchFeed(
    { name: "Google Noticias", url: `https://news.google.com/rss/search?q=${q}&hl=es&gl=ES&ceid=ES:es`, category: "mercados", lang: "es" },
    1800,
  );
  return dedupeAndSort(items).slice(0, limit);
}
