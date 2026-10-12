import { z } from 'zod';

/** How many players the leaderboard lists. */
export const PASS_OR_FALL_LEADERBOARD_SIZE = 100;

/** Rooms in the game: the desktop's ROOM_LEVELS.length. Change both together. */
export const PASS_OR_FALL_ROOMS = 12;

/** The most a room is worth (ROOM_POINTS.clear on the desktop), so a run can't score past this. */
const MAX_POINTS = PASS_OR_FALL_ROOMS * 1000;
/** Ten hours: far past any real run. */
const MAX_SECONDS = 36_000;

const PointsSchema = z.number().int().min(0).max(MAX_POINTS);
const SecondsSchema = z.number().min(0).max(MAX_SECONDS);

/** A door just unlocked: the room Continue would resume at, and what was banked on the way. */
export const PassOrFallProgressSchema = z
  .object({
    level: z
      .number()
      .int()
      .min(0)
      .max(PASS_OR_FALL_ROOMS - 1),
    points: PointsSchema,
    seconds: SecondsSchema,
  })
  .strict();

/** A finished run: out of the last door, or out of attempts. */
export const PassOrFallScoreSchema = z
  .object({
    points: PointsSchema,
    levels: z.number().int().min(0).max(PASS_OR_FALL_ROOMS),
    seconds: SecondsSchema,
  })
  .strict();

export const PassOrFallProgressResponseSchema = z.object({
  /** null until the user unlocks their first door. */
  progress: z
    .object({ level: z.number(), points: z.number(), seconds: z.number() })
    .nullable(),
});

export const PassOrFallLeaderboardEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  points: z.number(),
  levels: z.number(),
  seconds: z.number(),
  /** The signed-in user's own row. */
  you: z.boolean(),
});

export const PassOrFallLeaderboardResponseSchema = z.object({
  /** The top players, most points first; ties go to the faster run. */
  entries: z.array(PassOrFallLeaderboardEntrySchema),
  /** The signed-in user's best run, on the board or not; null without one. */
  you: z
    .object({
      rank: z.number(),
      points: z.number(),
      levels: z.number(),
      seconds: z.number(),
    })
    .nullable(),
});

export const PassOrFallScoreResponseSchema =
  PassOrFallLeaderboardResponseSchema.extend({
    /** The run beat the user's previous best. */
    personalBest: z.boolean(),
  });
