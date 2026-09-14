CREATE TABLE "notification_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" varchar(32) NOT NULL,
	"chat_id" varchar(128),
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "notification_configs_user_channel_unique" UNIQUE("user_id","channel")
);
--> statement-breakpoint
CREATE TABLE "user_smart_money_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"net_flow_weight" integer DEFAULT 50 NOT NULL,
	"large_transactions_weight" integer DEFAULT 25 NOT NULL,
	"activity_weight" integer DEFAULT 15 NOT NULL,
	"positive_flow_weight" integer DEFAULT 10 NOT NULL,
	"net_flow_threshold_usd" numeric(30, 2) DEFAULT '10000' NOT NULL,
	"large_transaction_count" integer DEFAULT 2 NOT NULL,
	"activity_count" integer DEFAULT 3 NOT NULL,
	"positive_flow_threshold_usd" numeric(30, 2) DEFAULT '1000' NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_smart_money_rules_user_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_tracking_configs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"chain" varchar(32) NOT NULL,
	"asset_type" varchar(32) NOT NULL,
	"asset_symbol" varchar(32) NOT NULL,
	"threshold" numeric(78, 18) NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_tracking_configs_unique" UNIQUE("user_id","chain","asset_type","asset_symbol")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(120) NOT NULL,
	"timezone" varchar(64) DEFAULT 'UTC' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "notification_configs" ADD CONSTRAINT "notification_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_smart_money_rules" ADD CONSTRAINT "user_smart_money_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_tracking_configs" ADD CONSTRAINT "user_tracking_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;