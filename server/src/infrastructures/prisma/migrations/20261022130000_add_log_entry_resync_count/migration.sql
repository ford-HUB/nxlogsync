-- Times the user marked the entry's day for resync.
ALTER TABLE "log_entries" ADD COLUMN "resync_count" INTEGER NOT NULL DEFAULT 0;
