import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const wallets = pgTable(
  "wallets",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    address: varchar("address", {
      length: 128,
    }).notNull(),

    chain: varchar("chain", {
      length: 32,
    }).notNull(),

    label: varchar("label", {
      length: 255,
    }),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("wallets_address_chain_unique").on(
      table.address,
      table.chain,
    ),
  ],
);