import { z } from 'zod';
import {
  TetrisLeaderboardEntrySchema,
  TetrisLeaderboardQuerySchema,
  TetrisLeaderboardResponseSchema,
  TetrisScoreResponseSchema,
  TetrisScoreSchema,
  TetrisSettingsResponseSchema,
  TetrisSettingsSchema,
} from '../validators/tetris-validator';

export type TetrisLeaderboardQueryDto = z.infer<
  typeof TetrisLeaderboardQuerySchema
>;
export type TetrisScoreDto = z.infer<typeof TetrisScoreSchema>;
export type TetrisLeaderboardEntryDto = z.infer<
  typeof TetrisLeaderboardEntrySchema
>;
export type TetrisLeaderboardResponseDto = z.infer<
  typeof TetrisLeaderboardResponseSchema
>;
export type TetrisScoreResponseDto = z.infer<typeof TetrisScoreResponseSchema>;
export type TetrisSettingsDto = z.infer<typeof TetrisSettingsSchema>;
export type TetrisSettingsResponseDto = z.infer<
  typeof TetrisSettingsResponseSchema
>;
