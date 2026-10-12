-- Tetris settings: each user's key bindings, so they follow the account to any machine.
CREATE TABLE "tetris_settings" (
    "user_id" TEXT NOT NULL,
    "keys" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tetris_settings_pkey" PRIMARY KEY ("user_id")
);
