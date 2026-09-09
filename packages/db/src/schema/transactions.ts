import {
  bigint,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
  unique,
} from "drizzle-orm/pg-core";

export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    chain: varchar("chain", {
      length: 32,
    }).notNull(),

    hash: varchar("hash", {
      length: 66,
    }).notNull(),

    blockNumber: bigint("block_number", {
      mode: "bigint",
    }).notNull(),

    blockHash: varchar("block_hash", {
      length: 66,
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

    gas: bigint("gas", {
      mode: "bigint",
    }).notNull(),

    gasPriceWei: numeric("gas_price_wei", {
      precision: 78,
      scale: 0,
    }),

    transactionIndex: bigint("transaction_index", {
      mode: "number",
    }),

    timestamp: timestamp("timestamp").notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("transactions_hash_unique").on(table.hash),
  ],
);