import { z } from 'zod';

/** The races two players can vote for; both have to pick the same one to start. */
export const DUEL_OPTIONS = ['short', 'medium', 'long', 'speed'] as const;

export const DuelOptionSchema = z.enum(DUEL_OPTIONS);

/** Seconds a race may last, also voted on: a Speed race's length, a words race's time limit. */
export const DUEL_DURATIONS = [15, 30, 60, 120] as const;

export const DuelDurationSchema = z.union([
  z.literal(15),
  z.literal(30),
  z.literal(60),
  z.literal(120),
]);

export const DuelInviteSchema = z
  .object({ userId: z.string().trim().min(1).max(100) })
  .strict();

export const DuelInviteRefSchema = z
  .object({ inviteId: z.string().min(1).max(100) })
  .strict();

export const DuelInviteResponseSchema = z
  .object({ inviteId: z.string().min(1).max(100), accept: z.boolean() })
  .strict();

/** A vote on the race, the time, or both; whatever is left out stays as it was. */
export const DuelVoteSchema = z
  .object({
    option: DuelOptionSchema.optional(),
    duration: DuelDurationSchema.optional(),
  })
  .strict()
  .refine((v) => v.option !== undefined || v.duration !== undefined, {
    message: 'Vote for a race or a time.',
  });

/** Where a racer is: the word and letter of their caret, and the correct characters behind it. */
export const DuelProgressSchema = z
  .object({
    word: z.number().int().min(0).max(1000),
    char: z.number().int().min(0).max(100),
    correct: z.number().int().min(0).max(20000),
    // Well past any human record, like the leaderboard's limit.
    wpm: z.number().min(0).max(350),
  })
  .strict();

export const DuelLeaderboardEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** Races won: a point each, as in the match score. */
  points: z.number(),
  wins: z.number(),
  losses: z.number(),
  draws: z.number(),
  /** The signed-in user's own row. */
  you: z.boolean(),
});

export const DuelLeaderboardResponseSchema = z.object({
  /** The players with the most 1v1 wins, most first. */
  entries: z.array(DuelLeaderboardEntrySchema),
  /** The signed-in user's record, on the board or not; null before their first decided race. */
  you: z
    .object({
      rank: z.number(),
      points: z.number(),
      wins: z.number(),
      losses: z.number(),
      draws: z.number(),
    })
    .nullable(),
});

export const DuelFinishSchema = DuelProgressSchema.extend({
  accuracy: z.number().min(0).max(100),
}).strict();
