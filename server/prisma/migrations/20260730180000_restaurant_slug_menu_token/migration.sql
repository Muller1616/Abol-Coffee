-- Permanent owner slug + public menu token (QR permanence).
-- Backfills the existing single-restaurant row, then enforces uniqueness + owner FK.

ALTER TABLE "restaurants"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "publicMenuToken" TEXT,
  ADD COLUMN IF NOT EXISTS "ownerId" TEXT;

UPDATE "restaurants"
SET
  "slug" = COALESCE(NULLIF(TRIM("slug"), ''), 'abol-coffee'),
  "publicMenuToken" = COALESCE(
    NULLIF(TRIM("publicMenuToken"), ''),
    substr(md5(random()::text || clock_timestamp()::text || id), 1, 24)
  ),
  "ownerId" = COALESCE(
    NULLIF(TRIM("ownerId"), ''),
    (SELECT "id" FROM "owners" ORDER BY "createdAt" ASC LIMIT 1)
  )
WHERE "slug" IS NULL
   OR "publicMenuToken" IS NULL
   OR "ownerId" IS NULL
   OR TRIM("slug") = ''
   OR TRIM("publicMenuToken") = ''
   OR TRIM("ownerId") = '';

-- Fail loudly if we still cannot link an owner (empty DB edge case handled by seed).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "restaurants"
    WHERE "ownerId" IS NULL OR "slug" IS NULL OR "publicMenuToken" IS NULL
  ) THEN
    RAISE EXCEPTION 'Migration requires at least one owner and restaurant row to backfill slug/token/ownerId';
  END IF;
END $$;

ALTER TABLE "restaurants"
  ALTER COLUMN "slug" SET NOT NULL,
  ALTER COLUMN "publicMenuToken" SET NOT NULL,
  ALTER COLUMN "ownerId" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "restaurants_slug_key" ON "restaurants"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "restaurants_publicMenuToken_key" ON "restaurants"("publicMenuToken");
CREATE UNIQUE INDEX IF NOT EXISTS "restaurants_ownerId_key" ON "restaurants"("ownerId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'restaurants_ownerId_fkey'
  ) THEN
    ALTER TABLE "restaurants"
      ADD CONSTRAINT "restaurants_ownerId_fkey"
      FOREIGN KEY ("ownerId") REFERENCES "owners"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
