CREATE SEQUENCE "public"."pages_revision_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "analytics_processed_events" (
	"event_id" uuid PRIMARY KEY,
	"event_type" varchar(16) NOT NULL,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_clicks_daily" (
	"page_id" uuid,
	"link_id" uuid,
	"date" date,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "link_clicks_daily_pkey" PRIMARY KEY("page_id","link_id","date")
);
--> statement-breakpoint
CREATE TABLE "page_views_daily" (
	"page_id" uuid,
	"date" date,
	"views" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "page_views_daily_pkey" PRIMARY KEY("page_id","date")
);
--> statement-breakpoint
CREATE TABLE "social_clicks_daily" (
	"page_id" uuid,
	"platform" varchar(32),
	"date" date,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "social_clicks_daily_pkey" PRIMARY KEY("page_id","platform","date")
);
--> statement-breakpoint
ALTER TABLE "pages" ADD COLUMN "revision" bigint DEFAULT nextval('pages_revision_seq') NOT NULL;--> statement-breakpoint
CREATE INDEX "analytics_processed_events_processed_at_idx" ON "analytics_processed_events" ("processed_at");--> statement-breakpoint
CREATE INDEX "link_clicks_daily_page_id_date_idx" ON "link_clicks_daily" ("page_id","date");--> statement-breakpoint
CREATE INDEX "social_clicks_daily_page_id_date_idx" ON "social_clicks_daily" ("page_id","date");