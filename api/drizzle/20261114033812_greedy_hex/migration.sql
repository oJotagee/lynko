ALTER TABLE "links" ADD COLUMN "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_schedule_check" CHECK ("starts_at" IS NULL OR "ends_at" IS NULL OR "ends_at" > "starts_at");