import { z } from 'zod';
import {
  PassOrFallLeaderboardEntrySchema,
  PassOrFallLeaderboardResponseSchema,
  PassOrFallProgressResponseSchema,
  PassOrFallProgressSchema,
  PassOrFallScoreResponseSchema,
  PassOrFallScoreSchema,
} from '../validators/pass-or-fall-validator';

export type PassOrFallProgressDto = z.infer<typeof PassOrFallProgressSchema>;
export type PassOrFallScoreDto = z.infer<typeof PassOrFallScoreSchema>;
export type PassOrFallProgressResponseDto = z.infer<
  typeof PassOrFallProgressResponseSchema
>;
export type PassOrFallLeaderboardEntryDto = z.infer<
  typeof PassOrFallLeaderboardEntrySchema
>;
export type PassOrFallLeaderboardResponseDto = z.infer<
  typeof PassOrFallLeaderboardResponseSchema
>;
export type PassOrFallScoreResponseDto = z.infer<
  typeof PassOrFallScoreResponseSchema
>;
