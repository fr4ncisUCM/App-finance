import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { readSession } from "./session";

/** Usuario autenticado actual (comprobado contra la BD), o redirige a /login. */
export const requireUser = cache(async () => {
  const session = await readSession();
  if (!session) redirect("/login");
  const [user] = await db
    .select({
      id: users.id,
      username: users.username,
      name: users.name,
      role: users.role,
      baseCurrency: users.baseCurrency,
    })
    .from(users)
    .where(eq(users.id, session.userId));
  if (!user) redirect("/login");
  return user;
});

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/");
  return user;
}
