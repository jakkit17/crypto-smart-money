CREATE TABLE "token_transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chain" varchar(32) NOT NULL,
	"transaction_hash" varchar(66) NOT NULL,
	"log_index" bigint NOT NULL,
	"block_number" bigint NOT NULL,
	"token_address" varchar(128) NOT NULL,
	"from_address" varchar(128) NOT NULL,
	"to_address" varchar(128) NOT NULL,
	"amount_raw" numeric(78, 0) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "token_transfers_tx_log_unique" UNIQUE("transaction_hash","log_index")
);
