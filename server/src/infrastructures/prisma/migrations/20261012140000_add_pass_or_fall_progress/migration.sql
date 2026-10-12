-- Pass or fall: each user's furthest unlocked room (where Continue resumes) and their best finished run.
CREATE TABLE "pass_or_fall_progress" (
    "user_id" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "seconds" DOUBLE PRECISION NOT NULL,
    "best_points" INTEGER,
    "best_levels" INTEGER,
    "best_seconds" DOUBLE PRECISION,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pass_or_fall_progress_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "pass_or_fall_progress_best_points_idx" ON "pass_or_fall_progress"("best_points");
