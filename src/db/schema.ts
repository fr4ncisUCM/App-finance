import { date, doublePrecision, index, integer, pgEnum, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "user"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 32 }).notNull().unique(),
  name: varchar("name", { length: 64 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("user"),
  // Moneda en la que se muestran los totales de la cartera.
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default("EUR"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;

// Valores que el usuario quiere vigilar.
export const watchlist = pgTable(
  "watchlist",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    symbol: varchar("symbol", { length: 32 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("watchlist_user_symbol_idx").on(t.userId, t.symbol)],
);

// Compras registradas por el usuario (cada fila es una compra).
export const positions = pgTable(
  "positions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    symbol: varchar("symbol", { length: 32 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    shares: doublePrecision("shares").notNull(),
    // Precio de compra por unidad, en la moneda en la que cotiza el valor.
    price: doublePrecision("price").notNull(),
    currency: varchar("currency", { length: 8 }).notNull(),
    // Comisiones pagadas, en la misma moneda.
    fees: doublePrecision("fees").notNull().default(0),
    boughtOn: date("bought_on", { mode: "string" }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("positions_user_idx").on(t.userId)],
);

export type Position = typeof positions.$inferSelect;

// Textos generados por IA guardados para no repetir la llamada (p. ej. el resumen del día).
export const aiNotes = pgTable("ai_notes", {
  key: varchar("key", { length: 160 }).primaryKey(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
