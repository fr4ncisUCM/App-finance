import Link from "next/link";
import { ArrowRight, Sparkles, Star } from "lucide-react";
import { generateBriefAction } from "@/app/actions/ai";
import { AiPanel } from "@/components/ai-panel";
import { ChangePill } from "@/components/market/change";
import { QuoteTable, QuoteTile } from "@/components/market/quote-table";
import { Headlines } from "@/components/news-list";
import { Card, CardTitle } from "@/components/ui";
import { aiEnabled, briefKey, readNote } from "@/lib/ai";
import { requireUser } from "@/lib/dal";
import { formatPrice, longToday, todayKey } from "@/lib/format";
import { HEADLINE_SYMBOLS } from "@/lib/market/catalog";
import { getNews } from "@/lib/market/news";
import { getMovers, getQuotes, type Mover } from "@/lib/market/yahoo";
import { getWatchlist } from "@/lib/queries";

export const metadata = { title: "Hoy" };
// Generar el resumen con IA puede tardar un poco.
export const maxDuration = 300;

function greeting() {
  const h = Number(new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return h < 6 ? "Buenas noches" : h < 14 ? "Buenos días" : h < 21 ? "Buenas tardes" : "Buenas noches";
}

function MoverList({ title, items }: { title: string; items: Mover[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-muted">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((m) => (
          <li key={m.symbol}>
            <Link href={`/valor/${encodeURIComponent(m.symbol)}`} className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-sm hover:bg-surface-2">
              <span className="w-14 shrink-0 font-mono text-xs font-semibold">{m.symbol}</span>
              <span className="min-w-0 flex-1 truncate">{m.name}</span>
              <span className="tabular text-muted">{formatPrice(m.price)}</span>
              <ChangePill pct={m.changePct} />
            </Link>
          </li>
        ))}
        {!items.length && <li className="text-sm text-muted">Sin datos ahora mismo.</li>}
      </ul>
    </div>
  );
}

export default async function TodayPage() {
  const user = await requireUser();
  const watch = await getWatchlist(user.id);
  const [headline, watchQuotes, news, gainers, losers, note] = await Promise.all([
    getQuotes(HEADLINE_SYMBOLS),
    getQuotes(watch.map((w) => w.symbol)),
    getNews("todas", 10),
    getMovers("day_gainers", 5),
    getMovers("day_losers", 5),
    aiEnabled() ? readNote(briefKey(user.id, todayKey())) : null,
  ]);

  return (
    <>
      <header className="mb-6">
        <p className="text-sm text-muted">{longToday()}</p>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting()}, {user.name.split(" ")[0]}
        </h1>
      </header>

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {headline.map((q) => (
          <QuoteTile key={q.symbol} q={q} />
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardTitle
              title={
                <>
                  <Sparkles size={18} className="text-accent" /> Resumen del día
                </>
              }
            />
            {aiEnabled() ? (
              <AiPanel
                action={generateBriefAction}
                initial={note ? { text: note.content, at: note.createdAt.toISOString() } : undefined}
                cta="Explícame qué está pasando hoy"
                waiting="Leyendo cotizaciones y titulares para prepararte el resumen… (puede tardar un minuto)"
              />
            ) : (
              <p className="text-sm text-muted">
                Activa el resumen diario con IA añadiendo la variable <code className="rounded bg-surface-2 px-1">ANTHROPIC_API_KEY</code> en
                Vercel. Te explicará en lenguaje sencillo qué mueve hoy el mercado y cómo van tus valores.
              </p>
            )}
          </Card>

          <Card>
            <CardTitle title="Lo que más se mueve en EE. UU.">
              <Link href="/movimientos" className="flex items-center gap-1 text-sm text-accent">
                Ver más <ArrowRight size={14} />
              </Link>
            </CardTitle>
            <div className="grid gap-6 md:grid-cols-2">
              <MoverList title="Las que más suben" items={gainers} />
              <MoverList title="Las que más bajan" items={losers} />
            </div>
            <p className="mt-4 text-xs text-muted">
              Ojo: las grandes subidas o bajadas suelen deberse a noticias puntuales (resultados, compras de empresas…) y
              muchas son empresas pequeñas y arriesgadas.
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardTitle title="Mis valores">
              <Link href="/cartera" className="flex items-center gap-1 text-sm text-accent">
                Gestionar <ArrowRight size={14} />
              </Link>
            </CardTitle>
            {watchQuotes.length ? (
              <QuoteTable quotes={watchQuotes} compact />
            ) : (
              <div className="py-4 text-center text-sm text-muted">
                <Star className="mx-auto mb-2 text-muted/60" />
                Aún no sigues ningún valor. Busca una empresa arriba y pulsa la estrella para tenerla aquí.
              </div>
            )}
          </Card>

          <Card>
            <CardTitle title="Últimas noticias">
              <Link href="/noticias" className="flex items-center gap-1 text-sm text-accent">
                Todas <ArrowRight size={14} />
              </Link>
            </CardTitle>
            <Headlines items={news} />
          </Card>
        </div>
      </div>
    </>
  );
}
