import { z } from 'zod';

/** How many players the leaderboard lists. */
export const AIM_LAB_LEADERBOARD_SIZE = 100;

/** Gridshot per round length, as the Unity build's TrainingSession names it; each has its own board. */
export const AIM_LAB_SETUPS = [
  'dot-gridshot-15',
  'dot-gridshot-30',
  'dot-gridshot-60',
] as const;

/** Mouse sensitivity on Valorant's scale; matches the desktop's AIM_LAB_SENSITIVITY. */
export const AIM_LAB_SENSITIVITY = { min: 0.01, max: 5 } as const;

/** Modes ranked by the lowest score (seconds) instead of the highest; none at the moment. */
export const AIM_LAB_LOWER_WINS: ReadonlySet<string> = new Set();

const SetupSchema = z.enum(AIM_LAB_SETUPS, {
  message: 'Unknown Aim lab mode.',
});

export const AimLabLeaderboardQuerySchema = z
  .object({ setup: SetupSchema })
  .strict();

export const AimLabScoreSchema = z
  .object({
    setup: SetupSchema,
    // Targets hit; a round lasts a minute at most, so an hour's worth is not a real session.
    score: z.number().positive().max(3_600),
    accuracy: z.number().min(0).max(100),
    shotsFired: z.number().int().min(0).max(100_000),
    shotsHit: z.number().int().min(0).max(100_000),
  })
  .strict()
  .refine((s) => s.shotsHit <= s.shotsFired, {
    message: 'More hits than shots fired.',
    path: ['shotsHit'],
  });

export const AimLabLeaderboardEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
  accuracy: z.number(),
  /** The signed-in user's own row. */
  you: z.boolean(),
});

export const AimLabLeaderboardResponseSchema = z.object({
  setup: z.string(),
  /** The top players for the mode, best first. */
  entries: z.array(AimLabLeaderboardEntrySchema),
  /** The signed-in user's best for the mode, on the board or not; null without one. */
  you: z
    .object({ rank: z.number(), score: z.number(), accuracy: z.number() })
    .nullable(),
});

export const AimLabScoreResponseSchema = AimLabLeaderboardResponseSchema.extend(
  {
    /** The session beat the user's previous best for the mode. */
    personalBest: z.boolean(),
  },
);

export const AimLabSettingsSchema = z
  .object({
    sensitivity: z
      .number()
      .min(AIM_LAB_SENSITIVITY.min)
      .max(AIM_LAB_SENSITIVITY.max),
  })
  .strict();

export const AimLabSettingsResponseSchema = z.object({
  /** null until the user saves their sensitivity for the first time. */
  sensitivity: z.number().nullable(),
});
