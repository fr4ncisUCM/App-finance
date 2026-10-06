// Horario de las principales bolsas (sin contar festivos).

export type Exchange = { id: string; name: string; tz: string; open: number; close: number };

export const EXCHANGES: Exchange[] = [
  { id: "ny", name: "Wall Street", tz: "America/New_York", open: 9.5, close: 16 },
  { id: "eu", name: "Europa", tz: "Europe/Madrid", open: 9, close: 17.5 },
  { id: "tk", name: "Tokio", tz: "Asia/Tokyo", open: 9, close: 15.5 },
];

function localParts(tz: string, now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", hour: "numeric", minute: "numeric", hourCycle: "h23" }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { weekday: get("weekday"), hour: Number(get("hour")) + Number(get("minute")) / 60 };
}

export function exchangeStatus(ex: Exchange, now = new Date()) {
  const { weekday, hour } = localParts(ex.tz, now);
  const weekend = weekday === "Sat" || weekday === "Sun";
  const open = !weekend && hour >= ex.open && hour < ex.close;
  return { open, label: open ? "Abierta" : "Cerrada" };
}

/** Hora de apertura y cierre de una bolsa, convertida a la hora de España. */
export function hoursInSpain(ex: Exchange) {
  const fmt = (h: number) => {
    // Construye la hora local de la bolsa hoy y la muestra en hora de Madrid.
    const now = new Date();
    const local = new Intl.DateTimeFormat("en-CA", { timeZone: ex.tz }).format(now);
    const hh = String(Math.floor(h)).padStart(2, "0");
    const mm = String(Math.round((h % 1) * 60)).padStart(2, "0");
    // Diferencia horaria entre la bolsa y UTC en ese momento.
    const probe = new Date(`${local}T${hh}:${mm}:00Z`);
    const tzHour = localParts(ex.tz, probe).hour;
    const utcHour = probe.getUTCHours() + probe.getUTCMinutes() / 60;
    let offset = tzHour - utcHour;
    if (offset > 12) offset -= 24;
    if (offset < -12) offset += 24;
    const real = new Date(probe.getTime() - offset * 3600_000);
    return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(real);
  };
  return `${fmt(ex.open)}–${fmt(ex.close)}`;
}
