-- Per-user data: every row belongs to the N-PAX User ID (lowercased) that connected.
-- Rows that existed before this migration go to the login saved at the time, if any.

-- Credentials: one row per user instead of a single id = 1 row.
ALTER TABLE "npax_credentials" ADD COLUMN "login_id" TEXT;
UPDATE "npax_credentials" SET "login_id" = "user_id", "user_id" = lower(trim("user_id"));
ALTER TABLE "npax_credentials" ALTER COLUMN "login_id" SET NOT NULL;
ALTER TABLE "npax_credentials" DROP CONSTRAINT "npax_credentials_pkey";
ALTER TABLE "npax_credentials" DROP COLUMN "id";
ALTER TABLE "npax_credentials" ADD CONSTRAINT "npax_credentials_pkey" PRIMARY KEY ("user_id");

-- Log entries. Entries with no saved login to claim them get '' (matches no user)
-- rather than being deleted; reassign them by hand if needed.
ALTER TABLE "log_entries" ADD COLUMN "user_id" TEXT;
UPDATE "log_entries" SET "user_id" = COALESCE((SELECT "user_id" FROM "npax_credentials" LIMIT 1), '');
ALTER TABLE "log_entries" ALTER COLUMN "user_id" SET NOT NULL;
DROP INDEX "log_entries_date_idx";
CREATE INDEX "log_entries_user_id_date_idx" ON "log_entries"("user_id", "date");

-- Sync runs.
ALTER TABLE "sync_runs" ADD COLUMN "user_id" TEXT;
UPDATE "sync_runs" SET "user_id" = COALESCE((SELECT "user_id" FROM "npax_credentials" LIMIT 1), '');
ALTER TABLE "sync_runs" ALTER COLUMN "user_id" SET NOT NULL;
DROP INDEX "sync_runs_started_at_idx";
CREATE INDEX "sync_runs_user_id_started_at_idx" ON "sync_runs"("user_id", "started_at");

-- Sync schedule: one row per user. With no saved login the old row is only
-- settings, and the next user to open Settings gets the defaults.
ALTER TABLE "sync_schedule" ADD COLUMN "user_id" TEXT;
UPDATE "sync_schedule" SET "user_id" = (SELECT "user_id" FROM "npax_credentials" LIMIT 1);
DELETE FROM "sync_schedule" WHERE "user_id" IS NULL;
ALTER TABLE "sync_schedule" ALTER COLUMN "user_id" SET NOT NULL;
ALTER TABLE "sync_schedule" DROP CONSTRAINT "sync_schedule_pkey";
ALTER TABLE "sync_schedule" DROP COLUMN "id";
ALTER TABLE "sync_schedule" ADD CONSTRAINT "sync_schedule_pkey" PRIMARY KEY ("user_id");

-- CreateTable
CREATE TABLE "user_sessions" (
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("token_hash")
);

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");
