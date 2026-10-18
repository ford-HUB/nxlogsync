-- Speed run: knocked-out runs score too, so each best records how far it got (1000 = finished).
ALTER TABLE "speed_run_best" ADD COLUMN "metres" INTEGER NOT NULL DEFAULT 1000;
