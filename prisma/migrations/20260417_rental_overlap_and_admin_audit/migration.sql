-- Enable btree_gist so text equality can be used in GiST exclusion constraints.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Audit log table for admin rental status transitions.
CREATE TABLE "AdminRentalStatusLog" (
    "id" TEXT NOT NULL,
    "rentalId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "fromStatus" "RentalStatus" NOT NULL,
    "toStatus" "RentalStatus" NOT NULL,
    "note" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRentalStatusLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AdminRentalStatusLog_rentalId_idx" ON "AdminRentalStatusLog"("rentalId");
CREATE INDEX "AdminRentalStatusLog_carId_idx" ON "AdminRentalStatusLog"("carId");
CREATE INDEX "AdminRentalStatusLog_changedByUserId_idx" ON "AdminRentalStatusLog"("changedByUserId");
CREATE INDEX "AdminRentalStatusLog_changedAt_idx" ON "AdminRentalStatusLog"("changedAt");

ALTER TABLE "AdminRentalStatusLog"
    ADD CONSTRAINT "AdminRentalStatusLog_rentalId_fkey"
    FOREIGN KEY ("rentalId") REFERENCES "Rental"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AdminRentalStatusLog"
    ADD CONSTRAINT "AdminRentalStatusLog_carId_fkey"
    FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AdminRentalStatusLog"
    ADD CONSTRAINT "AdminRentalStatusLog_changedByUserId_fkey"
    FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep rental date integrity guaranteed in DB.
ALTER TABLE "Rental"
    ADD CONSTRAINT "Rental_startDate_lte_endDate_check"
    CHECK ("startDate" <= "endDate");

-- Make overlapping active rentals for the same car impossible at DB level.
ALTER TABLE "Rental"
    ADD CONSTRAINT "Rental_no_overlap_active_status_excl"
    EXCLUDE USING GIST (
        "carId" WITH =,
        tsrange("startDate", "endDate", '[]') WITH &&
    )
    WHERE ("status" IN ('PENDING', 'CONFIRMED', 'ACTIVE'));
