import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { positions, watchlist } from "@/db/schema";

export async function getWatchlist(userId: number) {
  return db.select().from(watchlist).where(eq(watchlist.userId, userId)).orderBy(asc(watchlist.createdAt));
}

export async function isWatched(userId: number, symbol: string) {
  const [row] = await db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.symbol, symbol)));
  return !!row;
}

export async function getPositions(userId: number) {
  return db.select().from(positions).where(eq(positions.userId, userId)).orderBy(asc(positions.boughtOn), asc(positions.id));
}
