import { z } from 'zod';

/** How many players the leaderboard lists. */
export const SPEED_RUN_LEADERBOARD_SIZE = 100;

/** Far past any real run: a perfect one scores around 10,000. */
const MAX_POINTS = 200_000;
/** The course is 1000 m and tops out at 920 units/s (50 per metre), so no run beats ~55 s. */
const MIN_SECONDS = 30;
/** An hour: far past any real run. */
const MAX_SECONDS = 3_600;

/** A run that crossed the finish line. */
export const SpeedRunScoreSchema = z
  .object({
    points: z.number().int().min(0).max(MAX_POINTS),
    seconds: z.number().min(MIN_SECONDS).max(MAX_SECONDS),
  })
  .strict();

export const SpeedRunLeaderboardEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.number(),
  seconds: z.number(),
  /** The signed-in user's own row. */
  you: z.boolean(),
});

export const SpeedRunLeaderboardResponseSchema = z.object({
  /** The top players, most points first; ties go to the faster run. */
  entries: z.array(SpeedRunLeaderboardEntrySchema),
  /** The signed-in user's best run, on the board or not; null without one. */
  you: z
    .object({ rank: z.number(), points: z.number(), seconds: z.number() })
    .nullable(),
});

export const SpeedRunScoreResponseSchema =
  SpeedRunLeaderboardResponseSchema.extend({
    /** The run beat the user's previous best. */
    personalBest: z.boolean(),
  });
