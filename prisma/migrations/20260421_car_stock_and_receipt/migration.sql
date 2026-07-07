ALTER TABLE "Car" ADD COLUMN IF NOT EXISTS "stock" INTEGER NOT NULL DEFAULT 1;
UPDATE "Car" SET "stock" = 3 WHERE "stock" < 3;
ALTER TABLE "Rental" DROP CONSTRAINT IF EXISTS "Rental_no_overlap_active_status_excl";