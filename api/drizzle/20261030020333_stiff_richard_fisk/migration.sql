CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL CONSTRAINT "pages_user_id_unique" UNIQUE,
	"username" varchar(30) NOT NULL CONSTRAINT "pages_username_unique" UNIQUE,
	"title" varchar(80) NOT NULL,
	"bio" varchar(160),
	"avatar_url" text,
	"theme" jsonb NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;