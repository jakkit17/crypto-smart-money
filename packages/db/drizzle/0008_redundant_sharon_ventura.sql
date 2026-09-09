ALTER TABLE "smart_money_alerts" DROP CONSTRAINT "smart_money_alerts_wallet_unique";--> statement-breakpoint
ALTER TABLE "smart_money_alerts" ADD COLUMN "transaction_hash" varchar(66) NOT NULL;--> statement-breakpoint
ALTER TABLE "smart_money_alerts" ADD CONSTRAINT "smart_money_alerts_wallet_tx_unique" UNIQUE("wallet","transaction_hash");