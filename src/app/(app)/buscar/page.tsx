import Link from "next/link";
import { Change } from "@/components/market/change";
import { Card, PageHeader } from "@/components/ui";
import { formatPrice } from "@/lib/format";
import { getQuotes, searchSymbols, typeLabel } from "@/lib/market/yahoo";

export const metadata = { title: "Buscar" };

export default async function SearchPage({ searchParams }: PageProps<"/buscar">) {
  const { q } = await searchParams;
  const query = String(q ?? "").trim().slice(0, 60);
  const results = query ? await searchSymbols(query.toLowerCase()) : [];
  const quotes = await getQuotes(results.map((r) => r.symbol));
  const bySymbol = new Map(quotes.map((x) => [x.symbol, x]));

  return (
    <>
      <PageHeader title="Buscar" subtitle={query ? `Resultados para «${query}»` : "Escribe en el buscador de arriba el nombre de una empresa, un índice o una criptomoneda."} />
      {query && (
        <Card>
          {results.length ? (
            <ul className="divide-y divide-border">
              {results.map((r) => {
                const qt = bySymbol.get(r.symbol);
                return (
                  <li key={r.symbol}>
                    <Link href={`/valor/${encodeURIComponent(r.symbol)}`} className="flex items-center gap-4 py-3 hover:text-accent">
                      <span className="w-28 shrink-0 font-mono text-sm font-semibold">{r.symbol}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{r.name}</span>
                        <span className="text-xs text-muted">{[typeLabel(r.type), r.exchange].filter(Boolean).join(" · ")}</span>
                      </span>
                      {qt && (
                        <span className="text-right">
                          <span className="tabular block font-medium text-text">{formatPrice(qt.price, qt.currency)}</span>
                          <Change pct={qt.changePct} className="text-sm" />
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted">No he encontrado nada. Prueba con otro nombre o con el símbolo (por ejemplo, AAPL para Apple).</p>
          )}
          <p className="mt-4 text-xs text-muted">
            Un mismo valor puede aparecer en varias bolsas: el símbolo sin sufijo es EE. UU. (en dólares), «.MC» es Madrid, «.DE» Alemania, «.PA» París, «.L» Londres.
          </p>
        </Card>
      )}
    </>
  );
}
