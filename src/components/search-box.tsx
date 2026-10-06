"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

type Result = { symbol: string; name: string; exchange: string | null; type: string | null };

const TYPE: Record<string, string> = { EQUITY: "Acción", ETF: "ETF", INDEX: "Índice", CRYPTOCURRENCY: "Cripto", CURRENCY: "Divisa", FUTURE: "Futuro", MUTUALFUND: "Fondo" };

/** Buscador de valores con sugerencias mientras escribes. */
export function SearchBox({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) return;
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) {
          setResults(await res.json());
          setActive(-1);
        }
      } catch {
        /* petición cancelada */
      }
    }, 220);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(symbol: string) {
    setOpen(false);
    setQuery("");
    router.push(`/valor/${encodeURIComponent(symbol)}`);
  }

  const visible = open && query.trim().length > 0 && results.length > 0;

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (active >= 0 && results[active]) go(results[active].symbol);
          else if (query.trim()) {
            setOpen(false);
            router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
          }
        }}
      >
        <Search size={17} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
        <input
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (!e.target.value.trim()) setResults([]);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, -1));
            } else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Busca una empresa, índice, cripto… (p. ej. Apple, Tesla, bitcoin)"
          className="h-10 w-full rounded-xl border border-border bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-muted focus:border-accent"
        />
      </form>
      {visible && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-border bg-surface shadow-lg">
          {results.slice(0, 8).map((r, i) => (
            <li key={r.symbol}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r.symbol)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${i === active ? "bg-surface-2" : ""}`}
              >
                <span className="w-24 shrink-0 truncate font-mono text-xs font-semibold">{r.symbol}</span>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="shrink-0 text-xs text-muted">
                  {[r.type ? (TYPE[r.type] ?? r.type) : null, r.exchange].filter(Boolean).join(" · ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
