CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"page_id" uuid NOT NULL,
	"key" text NOT NULL CONSTRAINT "media_key_unique" UNIQUE,
	"type" varchar(16) NOT NULL,
	"mime_type" varchar(32) NOT NULL,
	"size" integer NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "avatar_media_id" uuid;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "appearance" jsonb;--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "social_links" jsonb DEFAULT '[]' NOT NULL;--> statement-breakpoint
CREATE INDEX "media_page_id_status_idx" ON "media" ("page_id","status");--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_page_id_pages_id_fkey" FOREIGN KEY ("page_id") REFERENCES "pages"("id") ON DELETE CASCADE;