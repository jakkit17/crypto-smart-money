CREATE TABLE "token_prices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain" varchar(32) NOT NULL,
	"token_address" varchar(128) NOT NULL,
	"price_usd" numeric(30, 10) NOT NULL,
	"source" varchar(64) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "token_prices_chain_address_unique" UNIQUE("chain","token_address")
);
