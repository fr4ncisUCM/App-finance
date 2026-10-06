"use client";

import { useEffect, useState } from "react";
import { EXCHANGES, exchangeStatus, hoursInSpain } from "@/lib/market/hours";

/** Indicador de qué bolsas están abiertas ahora mismo. Se actualiza cada minuto. */
export function MarketStatus() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  if (!now) return <div className="h-6" />;
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
      {EXCHANGES.map((ex) => {
        const { open, label } = exchangeStatus(ex, now);
        return (
          <li key={ex.id} className="flex items-center gap-1.5" title={`Horario: ${hoursInSpain(ex)} (hora de España), sin contar festivos`}>
            <span className={`h-2 w-2 rounded-full ${open ? "animate-pulse bg-up" : "bg-muted/50"}`} />
            <span className="font-medium">{ex.name}</span>
            <span className="text-muted">{label}</span>
          </li>
        );
      })}
    </ul>
  );
}
