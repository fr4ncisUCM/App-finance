"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/dal";
import { firstError, nameSchema, passwordSchema, usernameSchema, type FormState } from "@/lib/validation";

const createSchema = z.object({
  name: nameSchema,
  username: usernameSchema,
  password: passwordSchema,
  role: z.enum(["admin", "user"]),
});

export async function createUser(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { name, username, password, role } = parsed.data;
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.username, username));
  if (existing) return { error: "Ese nombre de usuario ya existe" };

  await db.insert(users).values({ name, username, role, passwordHash: await bcrypt.hash(password, 10) });
  revalidatePath("/ajustes/usuarios");
  return { ok: `Usuario «${username}» creado` };
}

const resetSchema = z.object({ userId: z.coerce.number().int(), password: passwordSchema });

export async function resetPassword(_: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const parsed = resetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(parsed.data.password, 10) })
    .where(eq(users.id, parsed.data.userId));
  return { ok: "Contraseña restablecida" };
}

export async function deleteUser(formData: FormData) {
  const admin = await requireAdmin();
  const userId = Number(formData.get("userId"));
  // Un admin no puede borrarse a sí mismo.
  await db.delete(users).where(and(eq(users.id, userId), ne(users.id, admin.id)));
  revalidatePath("/ajustes/usuarios");
}
