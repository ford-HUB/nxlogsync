import { z } from 'zod';
import {
  LeaderboardEntrySchema,
  LeaderboardQuerySchema,
  LeaderboardResponseSchema,
  NameAvailabilityQuerySchema,
  NameAvailabilityResponseSchema,
  TypingPlayerResponseSchema,
  TypingPlayerSchema,
  TypingScoreResponseSchema,
  TypingScoreSchema,
} from '../validators/typing-validator';

export type TypingPlayerDto = z.infer<typeof TypingPlayerSchema>;
export type NameAvailabilityQueryDto = z.infer<
  typeof NameAvailabilityQuerySchema
>;
export type NameAvailabilityResponseDto = z.infer<
  typeof NameAvailabilityResponseSchema
>;
export type LeaderboardQueryDto = z.infer<typeof LeaderboardQuerySchema>;
export type TypingScoreDto = z.infer<typeof TypingScoreSchema>;
export type TypingPlayerResponseDto = z.infer<
  typeof TypingPlayerResponseSchema
>;
export type LeaderboardEntryDto = z.infer<typeof LeaderboardEntrySchema>;
export type LeaderboardResponseDto = z.infer<typeof LeaderboardResponseSchema>;
export type TypingScoreResponseDto = z.infer<typeof TypingScoreResponseSchema>;
