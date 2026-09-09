CREATE TABLE "wallets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"address" varchar(128) NOT NULL,
	"chain" varchar(32) NOT NULL,
	"label" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
