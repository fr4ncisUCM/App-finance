"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { createSession, deleteSession } from "@/lib/session";
import { hasUsers } from "@/lib/users";
import { firstError, nameSchema, passwordSchema, usernameSchema, type FormState } from "@/lib/validation";

// Hash ficticio para comparar cuando el usuario no existe (mismo tiempo de respuesta).
const DUMMY_HASH = bcrypt.hashSync("dummy-password", 10);

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  const [user] = await db.select().from(users).where(eq(users.username, username));
  // Se compara siempre contra un hash para no revelar si el usuario existe.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) return { error: "Usuario o contraseña incorrectos", username };

  await createSession({ userId: user.id, role: user.role });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

const setupSchema = z.object({ name: nameSchema, username: usernameSchema, password: passwordSchema });

/** Crea el primer usuario (admin). Solo funciona si la BD está vacía. */
export async function setup(_: FormState, formData: FormData): Promise<FormState> {
  if (await hasUsers()) redirect("/login");
  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { name, username, password } = parsed.data;
  const [user] = await db
    .insert(users)
    .values({ name, username, passwordHash: await bcrypt.hash(password, 10), role: "admin" })
    .returning();

  await createSession({ userId: user.id, role: user.role });
  redirect("/");
}

const changePasswordSchema = z.object({ current: z.string(), next: passwordSchema });

export async function changePassword(_: FormState, formData: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const [user] = await db.select().from(users).where(eq(users.id, me.id));
  if (!(await bcrypt.compare(parsed.data.current, user.passwordHash))) {
    return { error: "La contraseña actual no es correcta" };
  }
  await db.update(users).set({ passwordHash: await bcrypt.hash(parsed.data.next, 10) }).where(eq(users.id, me.id));
  return { ok: "Contraseña actualizada" };
}
