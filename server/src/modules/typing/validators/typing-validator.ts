import { z } from 'zod';

/** How many players the leaderboard lists. */
export const LEADERBOARD_SIZE = 100;

/** A test setup, as the desktop's bestKey writes it: "time-30", "words-25-punctuation-numbers". */
const SetupSchema = z
  .string()
  .regex(
    /^(time-(15|30|60|120)|words-(10|25|50|100))(-punctuation)?(-numbers)?$/,
    'Unknown test setup.',
  );

export const TypingPlayerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Pick a name.')
      .max(20, 'Keep the name to 20 characters.'),
  })
  .strict();

export const NameAvailabilityQuerySchema = z
  .object({ name: z.string().trim().min(1).max(20) })
  .strict();

export const NameAvailabilityResponseSchema = z.object({
  /** False when another player already has the name (ignoring case and spacing). */
  available: z.boolean(),
});

export const LeaderboardQuerySchema = z.object({ setup: SetupSchema }).strict();

export const TypingScoreSchema = z
  .object({
    setup: SetupSchema,
    // Well past any human record; anything faster is not a real run.
    wpm: z.number().min(0).max(350),
    accuracy: z.number().min(0).max(100),
  })
  .strict();

export const TypingPlayerResponseSchema = z.object({
  /** Null until the user picks one. */
  name: z.string().nullable(),
});

export const LeaderboardEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  wpm: z.number(),
  accuracy: z.number(),
  /** The signed-in user's own row. */
  you: z.boolean(),
});

export const LeaderboardResponseSchema = z.object({
  setup: z.string(),
  /** The top players for the setup, fastest first. */
  entries: z.array(LeaderboardEntrySchema),
  /** The signed-in user's best for the setup, on the board or not; null without one. */
  you: z
    .object({ rank: z.number(), wpm: z.number(), accuracy: z.number() })
    .nullable(),
});

export const TypingScoreResponseSchema = LeaderboardResponseSchema.extend({
  /** The run beat the user's previous best for the setup. */
  personalBest: z.boolean(),
});
