import {
  pgTable,
  uuid,
  varchar,
  numeric,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const userTrackingConfigs =
  pgTable(
    "user_tracking_configs",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),

      chain: varchar("chain", {
        length: 32,
      }).notNull(),

      assetType: varchar("asset_type", {
        length: 32,
      }).notNull(),

      assetSymbol: varchar("asset_symbol", {
        length: 32,
      }).notNull(),

      threshold: numeric("threshold", {
        precision: 78,
        scale: 18,
      }).notNull(),

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
        "user_tracking_configs_unique",
      ).on(
        table.userId,
        table.chain,
        table.assetType,
        table.assetSymbol,
      ),
    ],
  );

  export type UserTrackingConfig =
  typeof userTrackingConfigs.$inferSelect;