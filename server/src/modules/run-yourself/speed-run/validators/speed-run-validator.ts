import { z } from 'zod';

/** How many players the leaderboard lists. */
export const SPEED_RUN_LEADERBOARD_SIZE = 100;

/** Far past any real run: a perfect one scores around 10,000. */
const MAX_POINTS = 200_000;
/** The course is 1000 m and tops out at 920 units/s (50 per metre), so no run beats ~55 s. */
const MIN_SECONDS = 30;
/** An hour: far past any real run. */
const MAX_SECONDS = 3_600;
/** The course's length: a run that covers it crossed the finish line. */
export const SPEED_RUN_METRES = 1000;

/** A finished run, or one an enemy knocked out short of the line (it still scores its points). */
export const SpeedRunScoreSchema = z
  .object({
    points: z.number().int().min(0).max(MAX_POINTS),
    metres: z.number().int().min(0).max(SPEED_RUN_METRES),
    seconds: z.number().min(0).max(MAX_SECONDS),
  })
  .strict()
  .refine((r) => r.metres < SPEED_RUN_METRES || r.seconds >= MIN_SECONDS, {
    path: ['seconds'],
    message: 'faster than the course can be run',
  });

export const SpeedRunLeaderboardEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.number(),
  /** SPEED_RUN_METRES when it finished; less when knocked out. */
  metres: z.number(),
  seconds: z.number(),
  /** The signed-in user's own row. */
  you: z.boolean(),
});

export const SpeedRunLeaderboardResponseSchema = z.object({
  /** The top players, most points first; ties go to the further, then the faster run. */
  entries: z.array(SpeedRunLeaderboardEntrySchema),
  /** The signed-in user's best run, on the board or not; null without one. */
  you: z
    .object({
      rank: z.number(),
      points: z.number(),
      metres: z.number(),
      seconds: z.number(),
    })
    .nullable(),
});

export const SpeedRunScoreResponseSchema =
  SpeedRunLeaderboardResponseSchema.extend({
    /** The run beat the user's previous best. */
    personalBest: z.boolean(),
  });
