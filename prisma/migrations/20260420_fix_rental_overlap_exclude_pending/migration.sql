-- Aktifkan btree_gist agar equality kolom text bisa dipakai di exclusion constraint GiST.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Hanya rental CONFIRMED dan ACTIVE yang mengunci mobil; PENDING (belum bayar) tidak boleh memblokir.
ALTER TABLE "Rental" DROP CONSTRAINT IF EXISTS "Rental_no_overlap_active_status_excl";

ALTER TABLE "Rental"
    ADD CONSTRAINT "Rental_no_overlap_active_status_excl"
    EXCLUDE USING GIST (
        "carId" WITH =,
        tsrange("startDate", "endDate", '[]') WITH &&
    )
    WHERE ("status" IN ('CONFIRMED', 'ACTIVE'));