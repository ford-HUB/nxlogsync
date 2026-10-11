-- Leaderboard names are unique, ignoring case and spacing.
ALTER TABLE "typing_players" ADD COLUMN "name_key" TEXT;
UPDATE "typing_players" SET "name_key" = LOWER(REGEXP_REPLACE(TRIM("name"), '\s+', ' ', 'g'));
ALTER TABLE "typing_players" ALTER COLUMN "name_key" SET NOT NULL;

CREATE UNIQUE INDEX "typing_players_name_key_key" ON "typing_players"("name_key");
