-- Auto-endorse: endorse synced 9h days at 11:59 PM on a picked day of each month.
ALTER TABLE "sync_schedule" ADD COLUMN "auto_endorse_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "auto_endorse_day" INTEGER,
ADD COLUMN "auto_endorsed_at" TIMESTAMP(3);
