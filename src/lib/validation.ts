import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Mínimo 3 caracteres")
  .max(32, "Máximo 32 caracteres")
  .regex(/^[a-z0-9._-]+$/, "Solo letras, números, punto, guion y guion bajo");

export const passwordSchema = z.string().min(6, "Mínimo 6 caracteres").max(128);

export const nameSchema = z.string().trim().min(1, "Obligatorio").max(64);

export type FormState = { error?: string; ok?: string; username?: string } | undefined;

export function firstError(err: z.ZodError) {
  return err.issues[0]?.message ?? "Datos no válidos";
}
