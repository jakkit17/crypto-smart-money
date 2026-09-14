CREATE TABLE "indexer_state" (
	"chain" varchar(32) PRIMARY KEY NOT NULL,
	"last_processed_block" bigint NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
