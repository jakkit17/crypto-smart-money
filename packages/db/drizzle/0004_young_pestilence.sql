CREATE TABLE "tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain" varchar(32) NOT NULL,
	"address" varchar(128) NOT NULL,
	"name" varchar(255),
	"symbol" varchar(64),
	"decimals" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tokens_chain_address_unique" UNIQUE("chain","address")
);
