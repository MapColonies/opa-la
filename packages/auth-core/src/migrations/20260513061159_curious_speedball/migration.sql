CREATE SCHEMA IF NOT EXISTS "auth_manager" ;
--> statement-breakpoint
CREATE TYPE "auth_manager"."asset_type_enum" AS ENUM('TEST', 'TEST_DATA', 'POLICY', 'DATA');--> statement-breakpoint
CREATE TYPE "auth_manager"."environment_enum" AS ENUM('np', 'stage', 'prod');--> statement-breakpoint
CREATE TABLE "auth_manager"."asset" (
	"name" varchar,
	"version" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"value" bytea NOT NULL,
	"uri" varchar NOT NULL,
	"type" "auth_manager"."asset_type_enum" NOT NULL,
	"environment" "auth_manager"."environment_enum"[] NOT NULL,
	"is_template" boolean NOT NULL,
	CONSTRAINT "PK_c3670311f777dc6ab9965408f97" PRIMARY KEY("name","version")
);
--> statement-breakpoint
CREATE TABLE "auth_manager"."bundle" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "auth_manager"."bundle_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"hash" text,
	"environment" "auth_manager"."environment_enum" NOT NULL,
	"metadata" jsonb,
	"assets" jsonb,
	"connections" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"key_version" integer,
	"opa_version" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auth_manager"."client" (
	"name" text PRIMARY KEY,
	"heb_name" text NOT NULL,
	"description" text,
	"branch" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"update_at" timestamp with time zone DEFAULT now() NOT NULL,
	"tech_point_of_contact" json,
	"product_point_of_contact" json,
	"tags" text[]
);
--> statement-breakpoint
CREATE TABLE "auth_manager"."connection" (
	"name" varchar,
	"version" integer,
	"environment" "auth_manager"."environment_enum",
	"enabled" boolean NOT NULL,
	"token" text NOT NULL,
	"allow_no_browser" boolean NOT NULL,
	"allow_no_origin" boolean NOT NULL,
	"domains" text[] NOT NULL,
	"origins" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "PK_4c3be048a366c9ce9277bac4c38" PRIMARY KEY("name","version","environment")
);
--> statement-breakpoint
CREATE TABLE "auth_manager"."domain" (
	"name" text PRIMARY KEY
);
--> statement-breakpoint
CREATE TABLE "auth_manager"."key" (
	"environment" "auth_manager"."environment_enum",
	"version" integer,
	"private_key" jsonb NOT NULL,
	"public_key" jsonb NOT NULL,
	CONSTRAINT "PK_ddf3d991c46b66651794ee56d58" PRIMARY KEY("environment","version")
);
