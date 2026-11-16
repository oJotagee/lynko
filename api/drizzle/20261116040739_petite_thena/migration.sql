CREATE TABLE "custom_domains" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL CONSTRAINT "custom_domains_user_id_unique" UNIQUE,
	"hostname" varchar(253) NOT NULL,
	"kind" varchar(10) NOT NULL,
	"status" varchar(16) NOT NULL,
	"verification_token" varchar(64) NOT NULL,
	"last_error" varchar(40),
	"owner_verified_at" timestamp with time zone,
	"activated_at" timestamp with time zone,
	"last_checked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "custom_domains_hostname_verified_unique" ON "custom_domains" ("hostname") WHERE "owner_verified_at" is not null;--> statement-breakpoint
CREATE INDEX "custom_domains_status_checked_idx" ON "custom_domains" ("status","last_checked_at");--> statement-breakpoint
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;