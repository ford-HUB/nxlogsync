import { z } from 'zod';

/** How many players the leaderboard lists. */
export const TETRIS_LEADERBOARD_SIZE = 100;

/** A game setup, as the desktop's tetrisBestKey writes it: the start level, "level-15". */
const SetupSchema = z
  .string()
  .regex(/^level-(1|5|10|15)$/, 'Unknown start level.');

export const TetrisLeaderboardQuerySchema = z
  .object({ setup: SetupSchema })
  .strict();

export const TetrisScoreSchema = z
  .object({
    setup: SetupSchema,
    // Far past any real game at the top start level's ×3 bonus; anything higher is not a real game.
    score: z.number().int().min(0).max(100_000_000),
    lines: z.number().int().min(0).max(100_000),
    level: z.number().int().min(1).max(1_000),
  })
  .strict();

export const TetrisLeaderboardEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number(),
  lines: z.number(),
  /** The signed-in user's own row. */
  you: z.boolean(),
});

export const TetrisLeaderboardResponseSchema = z.object({
  setup: z.string(),
  /** The top players for the start level, highest score first. */
  entries: z.array(TetrisLeaderboardEntrySchema),
  /** The signed-in user's best for the start level, on the board or not; null without one. */
  you: z
    .object({ rank: z.number(), score: z.number(), lines: z.number() })
    .nullable(),
});

export const TetrisScoreResponseSchema = TetrisLeaderboardResponseSchema.extend(
  {
    /** The game beat the user's previous best for the start level. */
    personalBest: z.boolean(),
  },
);

/** Each action's keys, as the desktop's TetrisKeyBindings writes them (KeyboardEvent.key, letters lower-case). */
const BoundKeysSchema = z
  .array(z.string().min(1).max(20))
  .max(2, 'At most two keys per action.');

export const TetrisKeyBindingsSchema = z
  .object({
    left: BoundKeysSchema,
    right: BoundKeysSchema,
    softDrop: BoundKeysSchema,
    hardDrop: BoundKeysSchema,
    rotateCw: BoundKeysSchema,
    rotateCcw: BoundKeysSchema,
    hold: BoundKeysSchema,
    skill: BoundKeysSchema,
    pause: BoundKeysSchema,
    restart: BoundKeysSchema,
  })
  .strict();

export const TetrisSettingsSchema = z
  .object({ keys: TetrisKeyBindingsSchema })
  .strict();

export const TetrisSettingsResponseSchema = z.object({
  /** null until the user saves their controls for the first time. */
  keys: TetrisKeyBindingsSchema.nullable(),
});
