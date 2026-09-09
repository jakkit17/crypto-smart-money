import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  integer,
  unique,
} from "drizzle-orm/pg-core";

export const tokens = pgTable(
  "tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    chain: varchar("chain", {
      length: 32,
    }).notNull(),

    address: varchar("address", {
      length: 128,
    }).notNull(),

    name: varchar("name", {
      length: 255,
    }),

    symbol: varchar("symbol", {
      length: 64,
    }),

    decimals: integer("decimals").notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("tokens_chain_address_unique").on(
      table.chain,
      table.address,
    ),
  ],
);