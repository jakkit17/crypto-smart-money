import {
  pgTable,
  uuid,
  integer,
  numeric,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const userSmartMoneyRules =
  pgTable(
    "user_smart_money_rules",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),

      netFlowWeight: integer(
        "net_flow_weight",
      )
        .notNull()
        .default(50),

      largeTransactionsWeight: integer(
        "large_transactions_weight",
      )
        .notNull()
        .default(25),

      activityWeight: integer(
        "activity_weight",
      )
        .notNull()
        .default(15),

      positiveFlowWeight: integer(
        "positive_flow_weight",
      )
        .notNull()
        .default(10),

      netFlowThresholdUsd: numeric(
        "net_flow_threshold_usd",
        {
          precision: 30,
          scale: 2,
        },
      )
        .notNull()
        .default("10000"),

      largeTransactionCount: integer(
        "large_transaction_count",
      )
        .notNull()
        .default(2),

      activityCount: integer(
        "activity_count",
      )
        .notNull()
        .default(3),

      positiveFlowThresholdUsd: numeric(
        "positive_flow_threshold_usd",
        {
          precision: 30,
          scale: 2,
        },
      )
        .notNull()
        .default("1000"),

      enabled: boolean("enabled")
        .notNull()
        .default(true),

      createdAt: timestamp("created_at")
        .defaultNow()
        .notNull(),

      updatedAt: timestamp("updated_at")
        .defaultNow()
        .notNull(),
    },

    (table) => [
      unique(
        "user_smart_money_rules_user_unique",
      ).on(table.userId),
    ],
  );