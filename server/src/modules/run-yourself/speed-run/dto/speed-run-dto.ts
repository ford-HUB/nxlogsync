import { z } from 'zod';
import {
  SpeedRunLeaderboardEntrySchema,
  SpeedRunLeaderboardResponseSchema,
  SpeedRunScoreResponseSchema,
  SpeedRunScoreSchema,
} from '../validators/speed-run-validator';

export type SpeedRunScoreDto = z.infer<typeof SpeedRunScoreSchema>;
export type SpeedRunLeaderboardEntryDto = z.infer<
  typeof SpeedRunLeaderboardEntrySchema
>;
export type SpeedRunLeaderboardResponseDto = z.infer<
  typeof SpeedRunLeaderboardResponseSchema
>;
export type SpeedRunScoreResponseDto = z.infer<
  typeof SpeedRunScoreResponseSchema
>;
