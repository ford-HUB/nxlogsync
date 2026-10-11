-- Typing-test leaderboard: a name per user and their best run per test setup.
CREATE TABLE "typing_players" (
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typing_players_pkey" PRIMARY KEY ("user_id")
);

CREATE TABLE "typing_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "setup" TEXT NOT NULL,
    "wpm" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typing_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "typing_scores_user_id_setup_key" ON "typing_scores"("user_id", "setup");

CREATE INDEX "typing_scores_setup_wpm_idx" ON "typing_scores"("setup", "wpm");

ALTER TABLE "typing_scores" ADD CONSTRAINT "typing_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "typing_players"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
