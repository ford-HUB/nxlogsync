import { z } from 'zod';
import {
  TetrisLeaderboardEntrySchema,
  TetrisLeaderboardQuerySchema,
  TetrisLeaderboardResponseSchema,
  TetrisScoreResponseSchema,
  TetrisScoreSchema,
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
