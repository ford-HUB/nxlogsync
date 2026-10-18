-- Typing 1v1 leaderboard: each player's races won, lost and drawn.
CREATE TABLE "typing_duel_records" (
    "user_id" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "typing_duel_records_pkey" PRIMARY KEY ("user_id")
);

CREATE INDEX "typing_duel_records_wins_idx" ON "typing_duel_records"("wins");

ALTER TABLE "typing_duel_records" ADD CONSTRAINT "typing_duel_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "typing_players"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
