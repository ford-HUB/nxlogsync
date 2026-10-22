-- Automatic sync now follows the mode. New users start on manual, and timed
-- schedules left paused become manual, so nothing starts uploading on its own.
ALTER TABLE "sync_schedule" ALTER COLUMN "mode" SET DEFAULT 'manual';
UPDATE "sync_schedule" SET "mode" = 'manual' WHERE "enabled" = false AND "mode" <> 'manual';
