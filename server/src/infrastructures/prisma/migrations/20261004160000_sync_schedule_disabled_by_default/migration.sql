-- New users start with automatic sync off; existing schedules keep their setting.
ALTER TABLE "sync_schedule" ALTER COLUMN "enabled" SET DEFAULT false;
