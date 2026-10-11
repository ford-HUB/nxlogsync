-- Tetris leaderboard: each player's best game per start level, under their typing-test name.
CREATE TABLE "tetris_scores" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "setup" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "lines" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tetris_scores_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tetris_scores_user_id_setup_key" ON "tetris_scores"("user_id", "setup");

CREATE INDEX "tetris_scores_setup_score_idx" ON "tetris_scores"("setup", "score");

ALTER TABLE "tetris_scores" ADD CONSTRAINT "tetris_scores_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "typing_players"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
