"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/dal";
import { BASE_CURRENCIES } from "@/lib/currencies";



export async function setBaseCurrency(formData: FormData) {
  const me = await requireUser();
  const value = String(formData.get("currency"));
  const currency = (BASE_CURRENCIES as readonly string[]).includes(value) ? value : "EUR";
  await db.update(users).set({ baseCurrency: currency }).where(eq(users.id, me.id));
  revalidatePath("/", "layout");
}
