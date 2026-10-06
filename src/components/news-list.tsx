import { ExternalLink } from "lucide-react";
import { timeAgo } from "@/lib/format";
import type { NewsItem } from "@/lib/market/news";

function Meta({ n }: { n: NewsItem }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted">
      <span className="font-medium">{n.source}</span>
      {n.date && <span>· {timeAgo(n.date)}</span>}
      {n.lang === "en" && <span className="rounded bg-surface-2 px-1 text-[10px] font-semibold">EN</span>}
    </span>
  );
}

/** Lista de titulares con imagen y resumen. */
export function NewsList({ items, withImages = true }: { items: NewsItem[]; withImages?: boolean }) {
  if (!items.length) return <p className="py-6 text-center text-sm text-muted">No hay noticias recientes.</p>;
  return (
    <ul className="divide-y divide-border">
      {items.map((n) => (
        <li key={n.id}>
          <a href={n.link} target="_blank" rel="noopener noreferrer" className="group flex gap-4 py-3.5">
            <div className="min-w-0 flex-1">
              <Meta n={n} />
              <h3 className="mt-1 leading-snug font-semibold group-hover:text-accent">
                {n.title}
                <ExternalLink size={12} className="ml-1 inline align-baseline text-muted opacity-0 group-hover:opacity-100" />
              </h3>
              {n.summary && <p className="mt-1 line-clamp-2 text-sm text-muted">{n.summary}</p>}
            </div>
            {withImages && n.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={n.image} alt="" loading="lazy" className="hidden h-20 w-32 shrink-0 rounded-lg object-cover sm:block" />
            )}
          </a>
        </li>
      ))}
    </ul>
  );
}

/** Versión compacta: solo titulares. */
export function Headlines({ items }: { items: NewsItem[] }) {
  if (!items.length) return <p className="py-4 text-center text-sm text-muted">No hay noticias recientes.</p>;
  return (
    <ul className="space-y-3">
      {items.map((n) => (
        <li key={n.id}>
          <a href={n.link} target="_blank" rel="noopener noreferrer" className="group block">
            <Meta n={n} />
            <p className="mt-0.5 text-sm leading-snug font-medium group-hover:text-accent">{n.title}</p>
          </a>
        </li>
      ))}
    </ul>
  );
}
