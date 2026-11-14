CREATE TABLE "billing_events" (
	"id" varchar(64) PRIMARY KEY,
	"type" varchar(40) NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL CONSTRAINT "subscriptions_user_id_unique" UNIQUE,
	"cycle" varchar(10) NOT NULL,
	"status" varchar(12) NOT NULL,
	"provider_customer_id" varchar(64),
	"provider_subscription_id" varchar(64) CONSTRAINT "subscriptions_provider_subscription_id_unique" UNIQUE,
	"checkout_id" varchar(64),
	"current_period_end" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "show_branding" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;