import Link from "next/link";
import { Change } from "@/components/market/change";
import { InfoTip } from "@/components/info-tip";
import { Card, CardTitle, PageHeader, Tabs } from "@/components/ui";
import { formatBig, formatPrice } from "@/lib/format";
import { IBEX_35, MARKET_GROUPS } from "@/lib/market/catalog";
import { getMovers, getQuotes, type Mover } from "@/lib/market/yahoo";

export const metadata = { title: "Lo que se mueve" };

const VIEWS = [
  { id: "eeuu", label: "EE. UU." },
  { id: "grandes", label: "Grandes empresas" },
  { id: "ibex", label: "IBEX 35" },
  { id: "cripto", label: "Cripto" },
];

function MoverTable({ items }: { items: Mover[] }) {
  if (!items.length) return <p className="py-4 text-center text-sm text-muted">Sin datos ahora mismo.</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted">
          <th className="py-2 font-medium">Empresa</th>
          <th className="py-2 text-right font-medium">Precio</th>
          <th className="py-2 text-right font-medium">Hoy</th>
        </tr>
      </thead>
      <tbody>
        {items.map((m) => (
          <tr key={m.symbol} className="border-b border-border/60 last:border-0">
            <td className="max-w-0 py-2 pr-2">
              <Link href={`/valor/${encodeURIComponent(m.symbol)}`} className="block truncate font-medium hover:text-accent">
                {m.name}
              </Link>
              <span className="text-[11px] text-muted">
                <span className="font-mono">{m.symbol}</span>
                {m.marketCap != null && <span title="Capitalización: lo que vale la empresa en bolsa"> · {formatBig(m.marketCap)} $</span>}
              </span>
            </td>
            <td className="tabular py-2 text-right">{formatPrice(m.price, m.currency)}</td>
            <td className="py-2 text-right">
              <Change pct={m.changePct} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function fromList(symbols: string[]): Promise<Mover[]> {
  const quotes = await getQuotes(symbols);
  return quotes.map((q) => ({ symbol: q.symbol, name: q.name, price: q.price, changePct: q.changePct, currency: q.currency, volume: q.volume, marketCap: null }));
}

function split(items: Mover[]) {
  const sorted = [...items].sort((a, b) => (b.changePct ?? 0) - (a.changePct ?? 0));
  const half = Math.ceil(sorted.length / 2);
  return { up: sorted.slice(0, half), down: sorted.slice(half).reverse() };
}

export default async function MoversPage({ searchParams }: PageProps<"/movimientos">) {
  const { v } = await searchParams;
  const view = VIEWS.some((x) => x.id === v) ? String(v) : "eeuu";

  let content;
  if (view === "eeuu") {
    const [gainers, losers, actives] = await Promise.all([getMovers("day_gainers"), getMovers("day_losers"), getMovers("most_actives")]);
    content = (
      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardTitle title="Las que más suben" />
          <MoverTable items={gainers} />
        </Card>
        <Card>
          <CardTitle title="Las que más bajan" />
          <MoverTable items={losers} />
        </Card>
        <Card>
          <CardTitle
            title={
              <>
                Las más negociadas <InfoTip text="Las acciones con más volumen de compraventa hoy: donde está la atención del mercado." />
              </>
            }
          />
          <MoverTable items={actives} />
        </Card>
      </div>
    );
  } else {
    const symbols =
      view === "ibex"
        ? IBEX_35.map((i) => i.symbol)
        : (MARKET_GROUPS.find((g) => g.id === (view === "grandes" ? "acciones-eeuu" : "cripto"))?.items.map((i) => i.symbol) ?? []);
    const { up, down } = split(await fromList(symbols));
    content = (
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle title="Mejores del día" />
          <MoverTable items={up} />
        </Card>
        <Card>
          <CardTitle title="Peores del día" />
          <MoverTable items={down} />
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Lo que se mueve" subtitle="Los valores que más suben, más bajan y más se negocian hoy.">
        <Tabs items={VIEWS.map((x) => ({ ...x, href: `/movimientos?v=${x.id}` }))} active={view} />
      </PageHeader>
      {content}
      <p className="mt-6 max-w-3xl text-sm text-muted">
        Consejo: un valor que sube mucho en un día no es necesariamente una buena inversión. Antes de dejarte llevar,
        abre su ficha, mira el gráfico a 1 año y lee por qué se ha movido en las noticias.
      </p>
    </>
  );
}
