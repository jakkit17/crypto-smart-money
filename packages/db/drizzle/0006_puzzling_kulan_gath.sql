CREATE TABLE "http_logs" (
	"http_log_id" bigserial PRIMARY KEY NOT NULL,
	"request_date" timestamp DEFAULT now() NOT NULL,
	"requester" text,
	"remote_address" varchar(100),
	"method" varchar(10),
	"url" varchar(1000),
	"body" text,
	"response" text,
	"header" text
);
