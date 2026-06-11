ALTER TABLE "auth_manager"."bundle" ADD COLUMN "revision" text;

UPDATE "auth_manager"."bundle" SET "revision" = environment::text || '-' || id::text;

ALTER TABLE "auth_manager"."bundle" ALTER COLUMN "revision" SET NOT NULL;
