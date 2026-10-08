-- Optional reminder on each picked work day, besides the month-end report.
ALTER TABLE "reminder_settings" ADD COLUMN "nudge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "reminder_settings" ADD COLUMN "last_nudge_date" TEXT;
