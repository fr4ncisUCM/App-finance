// Aplica las migraciones de ./drizzle. Se ejecuta antes de cada build (también en Vercel).
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";

config({ path: ".env.local" });

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL no definida: se omiten las migraciones.");
    return;
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  await pool.end();
  console.log("Migraciones aplicadas.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
