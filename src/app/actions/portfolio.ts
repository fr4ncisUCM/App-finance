"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { positions, watchlist } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { getQuote } from "@/lib/market/yahoo";
import { firstError, type FormState } from "@/lib/validation";

const symbolSchema = z.string().trim().min(1).max(32).regex(/^[A-Za-z0-9.^=\-]+$/, "Símbolo no válido");

/** Añade o quita un valor de «Mis valores». */
export async function toggleWatch(formData: FormData) {
  const me = await requireUser();
  const symbol = symbolSchema.parse(formData.get("symbol"));
  const name = String(formData.get("name") ?? symbol).slice(0, 160);
  const [existing] = await db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(and(eq(watchlist.userId, me.id), eq(watchlist.symbol, symbol)));
  if (existing) await db.delete(watchlist).where(eq(watchlist.id, existing.id));
  else await db.insert(watchlist).values({ userId: me.id, symbol, name });
  revalidatePath("/", "layout");
}

const positionSchema = z.object({
  symbol: symbolSchema,
  shares: z.coerce.number({ error: "Indica la cantidad" }).positive("La cantidad debe ser mayor que 0"),
  price: z.coerce.number({ error: "Indica el precio" }).positive("El precio debe ser mayor que 0"),
  fees: z.coerce.number().min(0).default(0),
  boughtOn: z.iso.date("Fecha no válida"),
  notes: z.string().trim().max(300).optional(),
});

/** Registra una compra. El nombre y la moneda se toman de la cotización. */
export async function addPosition(_: FormState, formData: FormData): Promise<FormState> {
  const me = await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = positionSchema.safeParse({ ...raw, fees: raw.fees || 0 });
  if (!parsed.success) return { error: firstError(parsed.error) };
  const symbol = parsed.data.symbol.toUpperCase();
  const quote = await getQuote(symbol);
  if (!quote) return { error: `No encuentro «${symbol}». Búscalo arriba y usa el botón «Añadir compra» de su ficha.` };

  await db.insert(positions).values({
    userId: me.id,
    symbol: quote.symbol,
    name: quote.name,
    shares: parsed.data.shares,
    price: parsed.data.price,
    fees: parsed.data.fees,
    currency: quote.currency ?? "USD",
    boughtOn: parsed.data.boughtOn,
    notes: parsed.data.notes || null,
  });
  revalidatePath("/cartera");
  return { ok: `Compra de ${quote.name} guardada` };
}

export async function deletePosition(formData: FormData) {
  const me = await requireUser();
  const id = Number(formData.get("id"));
  await db.delete(positions).where(and(eq(positions.id, id), eq(positions.userId, me.id)));
  revalidatePath("/cartera");
}
