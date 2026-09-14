import {
  pgTable,
  uuid,
  numeric,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

import { users } from "./users.js";
import { whaleAlerts } from "./whale-alerts.js";

export const userWhaleAlerts = pgTable(
  "user_whale_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, {
        onDelete: "cascade",
      }),

    whaleAlertId: uuid("whale_alert_id")
      .notNull()
      .references(() => whaleAlerts.id, {
        onDelete: "cascade",
      }),

    smartMoneyScore: numeric(
      "smart_money_score",
      {
        precision: 3,
        scale: 0,
      },
    ),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    sentAt: timestamp("sent_at"),
  },
  (table) => [
    unique(
      "user_whale_alerts_user_alert_unique",
    ).on(
      table.userId,
      table.whaleAlertId,
    ),
  ],
);