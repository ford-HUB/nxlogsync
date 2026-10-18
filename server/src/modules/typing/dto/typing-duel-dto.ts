import { z } from 'zod';
import {
  DuelDurationSchema,
  DuelFinishSchema,
  DuelInviteRefSchema,
  DuelInviteResponseSchema,
  DuelInviteSchema,
  DuelLeaderboardEntrySchema,
  DuelLeaderboardResponseSchema,
  DuelOptionSchema,
  DuelProgressSchema,
  DuelVoteSchema,
} from '../validators/typing-duel-validator';

export type DuelOptionDto = z.infer<typeof DuelOptionSchema>;
export type DuelDurationDto = z.infer<typeof DuelDurationSchema>;
export type DuelInviteDto = z.infer<typeof DuelInviteSchema>;
export type DuelInviteRefDto = z.infer<typeof DuelInviteRefSchema>;
export type DuelInviteResponseDto = z.infer<typeof DuelInviteResponseSchema>;
export type DuelVoteDto = z.infer<typeof DuelVoteSchema>;
export type DuelProgressDto = z.infer<typeof DuelProgressSchema>;
export type DuelFinishDto = z.infer<typeof DuelFinishSchema>;
export type DuelLeaderboardEntryDto = z.infer<
  typeof DuelLeaderboardEntrySchema
>;
export type DuelLeaderboardResponseDto = z.infer<
  typeof DuelLeaderboardResponseSchema
>;
