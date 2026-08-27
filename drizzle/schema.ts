import { boolean, decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/** Usuários autenticados pelo provedor de identidade do projeto. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/** Catálogo do estabelecimento, incluindo quantidades fracionadas para itens vendidos por peso. */
export const products = mysqlTable(
  "products",
  {
    id: int("id").autoincrement().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    costPrice: decimal("costPrice", { precision: 12, scale: 2 }).notNull(),
    salePrice: decimal("salePrice", { precision: 12, scale: 2 }).notNull(),
    unit: mysqlEnum("unit", ["un", "kg"]).notNull(),
    stockCurrent: decimal("stockCurrent", { precision: 14, scale: 3 }).notNull().default("0.000"),
    stockMinimum: decimal("stockMinimum", { precision: 14, scale: 3 }).notNull().default("0.000"),
    barcode: varchar("barcode", { length: 32 }).unique(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [index("products_name_idx").on(table.name), index("products_barcode_idx").on(table.barcode)],
);

/** Registro consolidado de uma venda confirmada no caixa. */
export const sales = mysqlTable(
  "sales",
  {
    id: int("id").autoincrement().primaryKey(),
    paymentMethod: mysqlEnum("paymentMethod", ["dinheiro", "debito", "credito", "pix"]).notNull(),
    totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
    amountPaid: decimal("amountPaid", { precision: 12, scale: 2 }).notNull(),
    changeAmount: decimal("changeAmount", { precision: 12, scale: 2 }).notNull().default("0.00"),
    itemCount: int("itemCount").notNull(),
    completedAt: timestamp("completedAt").defaultNow().notNull(),
  },
  table => [index("sales_completed_at_idx").on(table.completedAt)],
);

/** Itens com preço e descrição preservados no instante em que a venda foi concluída. */
export const saleItems = mysqlTable(
  "saleItems",
  {
    id: int("id").autoincrement().primaryKey(),
    saleId: int("saleId")
      .notNull()
      .references(() => sales.id),
    productId: int("productId")
      .notNull()
      .references(() => products.id),
    productName: varchar("productName", { length: 255 }).notNull(),
    barcode: varchar("barcode", { length: 32 }),
    unit: mysqlEnum("unit", ["un", "kg"]).notNull(),
    unitPrice: decimal("unitPrice", { precision: 12, scale: 2 }).notNull(),
    quantity: decimal("quantity", { precision: 14, scale: 3 }).notNull(),
    subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  },
  table => [index("sale_items_sale_id_idx").on(table.saleId), index("sale_items_product_id_idx").on(table.productId)],
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
