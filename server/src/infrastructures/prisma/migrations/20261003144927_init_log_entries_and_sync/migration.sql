-- CreateTable
CREATE TABLE "log_entries" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "start_minutes" INTEGER NOT NULL,
    "end_minutes" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "log_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_schedule" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "mode" TEXT NOT NULL DEFAULT 'daily',
    "daily_at_minutes" INTEGER NOT NULL DEFAULT 1080,
    "interval_hours" INTEGER NOT NULL DEFAULT 2,
    "window_start_minutes" INTEGER NOT NULL DEFAULT 480,
    "window_end_minutes" INTEGER NOT NULL DEFAULT 1080,
    "days" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "monthly_days_before_end" INTEGER NOT NULL DEFAULT 0,
    "monthly_weekdays_only" BOOLEAN NOT NULL DEFAULT true,
    "target_url" TEXT NOT NULL DEFAULT 'https://workflow.n-pax.com/index.aspx',
    "retry_attempts" INTEGER NOT NULL DEFAULT 3,
    "skip_empty_days" BOOLEAN NOT NULL DEFAULT true,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sync_schedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_runs" (
    "id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "trigger" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "entry_count" INTEGER NOT NULL DEFAULT 0,
    "minutes" INTEGER NOT NULL DEFAULT 0,
    "message" TEXT,

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "log_entries_date_idx" ON "log_entries"("date");

-- CreateIndex
CREATE INDEX "sync_runs_started_at_idx" ON "sync_runs"("started_at");
