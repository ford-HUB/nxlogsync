-- AlterTable
ALTER TABLE "log_entries" ADD COLUMN "edited_since_sync" BOOLEAN NOT NULL DEFAULT false;
