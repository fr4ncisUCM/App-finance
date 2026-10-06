"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, ChartLine, Flame, House, Newspaper, Settings, Star } from "lucide-react";

const items = [
  { href: "/", label: "Hoy", icon: House },
  { href: "/mercados", label: "Mercados", icon: ChartLine },
  { href: "/movimientos", label: "Lo que se mueve", icon: Flame },
  { href: "/noticias", label: "Noticias", icon: Newspaper },
  { href: "/cartera", label: "Mis valores", icon: Star },
  { href: "/aprender", label: "Aprender", icon: BookOpen },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-3 py-5 lg:flex">
      <Link href="/" className="mb-6 flex items-center gap-2.5 px-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-lg font-black text-accent-fg">P</span>
        <span className="text-xl font-bold tracking-tight">Pulso</span>
      </Link>
      <nav className="flex-1 space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-2 hover:text-text"
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/ajustes"
        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${
          isActive(pathname, "/ajustes") ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-2 hover:text-text"
        }`}
      >
        <Settings size={19} />
        <span className="flex-1 truncate">Ajustes</span>
        <span className="truncate text-xs text-muted">{userName}</span>
      </Link>
    </aside>
  );
}

/** Navegación compacta para pantallas estrechas. */
export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-border bg-surface px-3 py-2 lg:hidden">
      {[...items, { href: "/ajustes", label: "Ajustes", icon: Settings }].map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
            isActive(pathname, href) ? "bg-accent/10 text-accent" : "text-muted"
          }`}
        >
          <Icon size={16} />
          {label}
        </Link>
      ))}
    </nav>
  );
}
