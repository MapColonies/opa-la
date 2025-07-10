CREATE SCHEMA "token_kiosk";
--> statement-breakpoint
CREATE TABLE "token_kiosk"."users" (
	"id" text PRIMARY KEY NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"token" text NOT NULL,
	"token_creation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"token_expiration_date" timestamp with time zone NOT NULL,
	"token_creation_count" integer DEFAULT 0 NOT NULL,
	"is_banned" boolean DEFAULT false NOT NULL
);
