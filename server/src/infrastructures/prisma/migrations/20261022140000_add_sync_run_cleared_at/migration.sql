-- When the user cleared the run from Recent syncs; cleared runs are kept, not deleted.
ALTER TABLE "sync_runs" ADD COLUMN "cleared_at" TIMESTAMP(3);
