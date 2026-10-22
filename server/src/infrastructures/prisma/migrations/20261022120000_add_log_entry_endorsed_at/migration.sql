-- When a day was endorsed to the checker on N-PAX; set on all of that day's entries.
ALTER TABLE "log_entries" ADD COLUMN "endorsed_at" TIMESTAMP(3);
