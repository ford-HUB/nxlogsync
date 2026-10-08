-- Email reminders to log hours, one row per user.
CREATE TABLE "reminder_settings" (
    "user_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "at_minutes" INTEGER NOT NULL DEFAULT 1020,
    "days" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[],
    "email" TEXT,
    "email_fetched_at" TIMESTAMP(3),
    "last_sent_date" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminder_settings_pkey" PRIMARY KEY ("user_id")
);
