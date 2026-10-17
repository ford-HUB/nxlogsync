-- Aim lab settings: each user's mouse sensitivity, so it follows the account to any machine.
CREATE TABLE "aim_lab_settings" (
    "user_id" TEXT NOT NULL,
    "sensitivity" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aim_lab_settings_pkey" PRIMARY KEY ("user_id")
);
