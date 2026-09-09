CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain" varchar(32) NOT NULL,
	"hash" varchar(66) NOT NULL,
	"block_number" bigint NOT NULL,
	"block_hash" varchar(66) NOT NULL,
	"from_address" varchar(128) NOT NULL,
	"to_address" varchar(128),
	"value_wei" numeric(78, 0) NOT NULL,
	"gas" bigint NOT NULL,
	"gas_price_wei" numeric(78, 0),
	"transaction_index" bigint,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_hash_unique" UNIQUE("hash")
);
