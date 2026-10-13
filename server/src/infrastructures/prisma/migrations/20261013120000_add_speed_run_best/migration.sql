-- Speed run: each user's best run to the finish line.
CREATE TABLE "speed_run_best" (
    "user_id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "seconds" DOUBLE PRECISION NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "speed_run_best_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "speed_run_best_points_idx" ON "speed_run_best"("points");
