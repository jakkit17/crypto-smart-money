import {
  bigserial,
  timestamp,
  text,
  varchar,
  pgTable,
} from "drizzle-orm/pg-core";

export const httpLogs = pgTable("http_logs", {
  httpLogId: bigserial("http_log_id", {
    mode: "number",
  }).primaryKey(),

  requestDate: timestamp("request_date").notNull().defaultNow(),

  requester: text("requester"),

  remoteAddress: varchar("remote_address", {
    length: 100,
  }),

  method: varchar("method", {
    length: 10,
  }),

  url: varchar("url", {
    length: 1000,
  }),

  body: text("body"),

  response: text("response"),

  header: text("header"),
});