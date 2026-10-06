import { Lightbulb } from "lucide-react";
import { QuoteTable } from "@/components/market/quote-table";
import { Card, CardTitle, PageHeader } from "@/components/ui";
import { IBEX_35, MARKET_GROUPS } from "@/lib/market/catalog";
import { getQuotes } from "@/lib/market/yahoo";

export const metadata = { title: "Mercados" };

const SECTIONS = [
  ...MARKET_GROUPS,
  {
    id: "ibex",
    title: "IBEX 35: empresas",
    short: "Las 35 del IBEX",
    explainer: "Las 35 empresas españolas que forman el IBEX 35, ordenadas de la que más sube a la que más baja hoy.",
    items: IBEX_35,
  },
];

export default async function MarketsPage() {
  const all = await getQuotes(SECTIONS.flatMap((s) => s.items.map((i) => i.symbol)));
  const bySymbol = new Map(all.map((q) => [q.symbol, q]));

  return (
    <>
      <PageHeader title="Mercados" subtitle="Cómo van hoy las bolsas, las divisas, las materias primas y las criptomonedas." />

      <nav className="sticky top-[65px] z-10 -mx-4 mb-6 flex gap-1 overflow-x-auto bg-bg/85 px-4 py-2 backdrop-blur lg:-mx-8 lg:px-8">
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="shrink-0 rounded-lg bg-surface-2 px-3 py-1.5 text-sm font-medium text-muted hover:text-text">
            {s.title}
          </a>
        ))}
      </nav>

      <div className="grid gap-6 2xl:grid-cols-2">
        {SECTIONS.map((s) => {
          let quotes = s.items.map((i) => bySymbol.get(i.symbol)).filter((q) => !!q);
          if (s.id === "ibex" || s.id === "acciones-eeuu") quotes = quotes.sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));
          return (
            <Card key={s.id} id={s.id} className="scroll-mt-32">
              <CardTitle title={s.title} />
              <p className="mb-3 flex gap-2 rounded-xl bg-surface-2/70 p-3 text-sm text-muted">
                <Lightbulb size={16} className="mt-0.5 shrink-0 text-accent" />
                {s.explainer}
              </p>
              <QuoteTable quotes={quotes} hints={s.items} />
            </Card>
          );
        })}
      </div>
    </>
  );
}
