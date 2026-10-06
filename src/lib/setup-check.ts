import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export type SetupProblem = { title: string; steps: string[]; detail?: string };

/** Comprueba que el despliegue tiene lo necesario y explica cómo arreglarlo si no. */
export async function findSetupProblem(): Promise<SetupProblem | null> {
  const missing = [!process.env.DATABASE_URL && "DATABASE_URL", !process.env.SESSION_SECRET && "SESSION_SECRET"].filter(Boolean);
  if (missing.length) {
    return {
      title: `Falta configurar: ${missing.join(" y ")}`,
      steps: [
        ...(missing.includes("DATABASE_URL")
          ? ["En Vercel, abre el proyecto → Storage → Create Database → Neon, y conéctala a todos los entornos (crea DATABASE_URL sola)."]
          : []),
        ...(missing.includes("SESSION_SECRET")
          ? ["En Settings → Environment Variables, añade SESSION_SECRET con un texto aleatorio largo (40 caracteres o más)."]
          : []),
        "Ve a Deployments → menú «…» del último despliegue → Redeploy. Las variables nuevas solo se aplican al volver a desplegar.",
      ],
    };
  }
  try {
    await db.execute(sql`select 1 from users limit 1`);
    return null;
  } catch (err) {
    const e = err as { code?: string; message?: string; cause?: { code?: string; message?: string } };
    const code = e.code ?? e.cause?.code;
    if (code === "42P01") {
      return {
        title: "La base de datos está conectada pero vacía",
        steps: [
          "Las tablas se crean al desplegar. Ve a Deployments → menú «…» del último despliegue → Redeploy.",
          "Si sigue igual, revisa en el log del build que aparezca «Migraciones aplicadas.».",
        ],
      };
    }
    return {
      title: "No se puede conectar con la base de datos",
      steps: [
        "Comprueba en Settings → Environment Variables que DATABASE_URL existe para el entorno Production.",
        "Comprueba en Storage que la base de datos de Neon sigue conectada al proyecto y vuelve a desplegar.",
      ],
      detail: (e.cause?.message ?? e.message ?? String(err)).slice(0, 300),
    };
  }
}
