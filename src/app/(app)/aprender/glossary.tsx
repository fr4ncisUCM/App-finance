"use client";

import { useState } from "react";
import { Input } from "@/components/ui";
import type { Term } from "@/data/learn";

const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function Glossary({ terms }: { terms: Term[] }) {
  const [q, setQ] = useState("");
  const filtered = q ? terms.filter((t) => norm(t.term + " " + t.def).includes(norm(q))) : terms;
  return (
    <div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Busca un término (PER, dividendo, ETF…)" className="mb-4" />
      <dl className="grid gap-x-8 gap-y-4 md:grid-cols-2">
        {filtered.map((t) => (
          <div key={t.term}>
            <dt className="font-semibold">{t.term}</dt>
            <dd className="text-sm text-muted">{t.def}</dd>
          </div>
        ))}
        {!filtered.length && <p className="text-sm text-muted">No hay ningún término con «{q}».</p>}
      </dl>
    </div>
  );
}
