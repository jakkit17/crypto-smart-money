import {
  pgTable,
  uuid,
  varchar,
  numeric,
  bigint,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const whaleAlerts = pgTable(
  "whale_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    chain: varchar("chain", { length: 32 }).notNull(),

    hash: varchar("hash", { length: 66 }).notNull(),

    blockNumber: bigint("block_number", {
      mode: "bigint",
    }).notNull(),

    fromAddress: varchar("from_address", {
      length: 128,
    }).notNull(),

    toAddress: varchar("to_address", {
      length: 128,
    }),

    valueWei: numeric("value_wei", {
      precision: 78,
      scale: 0,
    }).notNull(),

    valueEth: numeric("value_eth", {
      precision: 78,
      scale: 18,
    }).notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    sentAt: timestamp("sent_at"),
  },

  (table) => [
    unique("whale_alerts_hash_unique").on(table.hash),
  ],
);