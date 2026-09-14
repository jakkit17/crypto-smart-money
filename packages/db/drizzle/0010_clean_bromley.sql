CREATE TABLE "whale_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain" varchar(32) NOT NULL,
	"hash" varchar(66) NOT NULL,
	"block_number" bigint NOT NULL,
	"from_address" varchar(128) NOT NULL,
	"to_address" varchar(128),
	"value_wei" numeric(78, 0) NOT NULL,
	"value_eth" numeric(78, 18) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	CONSTRAINT "whale_alerts_hash_unique" UNIQUE("hash")
);
