-- Aim lab leaderboard: each player's best session per mode, under their typing-test name.
CREATE TABLE "aim_lab_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "setup" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "shots_fired" INTEGER NOT NULL,
    "shots_hit" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aim_lab_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "aim_lab_scores_user_id_setup_key" ON "aim_lab_scores"("user_id", "setup");

CREATE INDEX "aim_lab_scores_setup_score_idx" ON "aim_lab_scores"("setup", "score");

ALTER TABLE "aim_lab_scores" ADD CONSTRAINT "aim_lab_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "typing_players"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
