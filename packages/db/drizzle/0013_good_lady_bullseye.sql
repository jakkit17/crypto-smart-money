CREATE TABLE "user_whale_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"whale_alert_id" uuid NOT NULL,
	"smart_money_score" numeric(3, 0),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"sent_at" timestamp,
	CONSTRAINT "user_whale_alerts_user_alert_unique" UNIQUE("user_id","whale_alert_id")
);
--> statement-breakpoint
ALTER TABLE "user_whale_alerts" ADD CONSTRAINT "user_whale_alerts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_whale_alerts" ADD CONSTRAINT "user_whale_alerts_whale_alert_id_whale_alerts_id_fk" FOREIGN KEY ("whale_alert_id") REFERENCES "public"."whale_alerts"("id") ON DELETE cascade ON UPDATE no action;