-- Run yourself settings: each user's key bindings per game, so they follow the account to any machine.
CREATE TABLE "run_settings" (
    "user_id" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "run_settings_pkey" PRIMARY KEY ("user_id")
);
