DROP INDEX "auth_tokens_user_id_type_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "auth_tokens_user_id_type_idx" ON "auth_tokens" ("user_id","type");