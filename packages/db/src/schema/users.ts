import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    authUserId: uuid("auth_user_id").unique(),

    email: varchar("email", {
      length: 320,
    }).notNull(),

    name: varchar("name", {
      length: 120,
    }).notNull(),

    timezone: varchar("timezone", {
      length: 64,
    })
      .notNull()
      .default("UTC"),

    createdAt: timestamp("created_at")
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull(),
  },

  (table) => [
    unique("users_email_unique").on(
      table.email,
    ),
  ],
);