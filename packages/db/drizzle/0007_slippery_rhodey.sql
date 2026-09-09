CREATE TABLE "smart_money_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet" varchar(128) NOT NULL,
	"score" integer NOT NULL,
	"net_flow_usd" numeric(30, 10) NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "smart_money_alerts_wallet_unique" UNIQUE("wallet")
);
