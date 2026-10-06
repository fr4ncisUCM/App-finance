import "server-only";
import { count } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

export async function hasUsers() {
  const [{ value }] = await db.select({ value: count() }).from(users);
  return value > 0;
}
