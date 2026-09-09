import {
  pgTable,
  timestamp,
  uuid,
  varchar,
  integer,
  numeric,
  unique,
} from "drizzle-orm/pg-core";

export const smartMoneyAlerts = pgTable(
  "smart_money_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    wallet: varchar("wallet", {
      length: 128,
    }).notNull(),
    
    transactionHash: varchar(
    "transaction_hash",
    {
        length: 66,
    },
    ).notNull(),

    score: integer("score").notNull(),

    netFlowUsd: numeric("net_flow_usd", {
      precision: 30,
      scale: 10,
    }).notNull(),

    sentAt: timestamp("sent_at")
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique(
        "smart_money_alerts_wallet_tx_unique",
        ).on(
        table.wallet,
        table.transactionHash,
        ),
  ],
);