import {
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
  unique,
} from "drizzle-orm/pg-core";

export const tokenPrices = pgTable(
  "token_prices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    chain: varchar("chain", {
      length: 32,
    }).notNull(),

    tokenAddress: varchar("token_address", {
      length: 128,
    }).notNull(),

    priceUsd: numeric("price_usd", {
      precision: 30,
      scale: 10,
    }).notNull(),

    source: varchar("source", {
      length: 64,
    }).notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("token_prices_chain_address_unique").on(
      table.chain,
      table.tokenAddress,
    ),
  ],
);