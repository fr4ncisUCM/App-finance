import { MarketStatus } from "@/components/market/market-status";
import { SearchBox } from "@/components/search-box";
import { MobileNav, Sidebar } from "@/components/sidebar";
import { requireUser } from "@/lib/dal";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();
  return (
    <div className="flex min-h-dvh">
      <Sidebar userName={user.name} />
      <div className="min-w-0 flex-1">
        <MobileNav />
        <header className="sticky top-0 z-20 border-b border-border bg-bg/85 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 lg:px-8">
            <SearchBox />
            <MarketStatus />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8">{children}</main>
        <footer className="mx-auto max-w-7xl px-4 pb-8 text-xs text-muted lg:px-8">
          Datos de Yahoo Finance (algunas bolsas con hasta 15 min de retraso) y noticias de los medios citados. Pulso es
          una herramienta informativa: no es asesoramiento financiero.
        </footer>
      </div>
    </div>
  );
}
