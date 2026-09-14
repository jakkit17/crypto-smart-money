import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";

export const notificationConfigs =
  pgTable(
    "notification_configs",
    {
      id: uuid("id")
        .defaultRandom()
        .primaryKey(),

      userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
          onDelete: "cascade",
        }),

      channel: varchar("channel", {
        length: 32,
      }).notNull(),

      chatId: varchar("chat_id", {
        length: 128,
      }),

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
        "notification_configs_user_channel_unique",
      ).on(
        table.userId,
        table.channel,
      ),
    ],
  );