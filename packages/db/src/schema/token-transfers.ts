import {
  bigint,
  numeric,
  pgTable,
  timestamp,
  uuid,
  varchar,
  unique,
} from "drizzle-orm/pg-core";

export const tokenTransfers = pgTable(
  "token_transfers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    chain: varchar("chain", {
      length: 32,
    }).notNull(),

    transactionHash: varchar("transaction_hash", {
      length: 66,
    }).notNull(),

    logIndex: bigint("log_index", {
      mode: "number",
    }).notNull(),

    blockNumber: bigint("block_number", {
      mode: "bigint",
    }).notNull(),

    tokenAddress: varchar("token_address", {
      length: 128,
    }).notNull(),

    fromAddress: varchar("from_address", {
      length: 128,
    }).notNull(),

    toAddress: varchar("to_address", {
      length: 128,
    }).notNull(),

    amountRaw: numeric("amount_raw", {
      precision: 78,
      scale: 0,
    }).notNull(),

    timestamp: timestamp("timestamp").notNull(),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("token_transfers_tx_log_unique").on(
      table.transactionHash,
      table.logIndex,
    ),
  ],
);