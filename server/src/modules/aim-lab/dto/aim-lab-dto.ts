import { z } from 'zod';
import {
  AimLabLeaderboardEntrySchema,
  AimLabLeaderboardQuerySchema,
  AimLabLeaderboardResponseSchema,
  AimLabScoreResponseSchema,
  AimLabScoreSchema,
  AimLabSettingsResponseSchema,
  AimLabSettingsSchema,
} from '../validators/aim-lab-validator';

export type AimLabLeaderboardQueryDto = z.infer<
  typeof AimLabLeaderboardQuerySchema
>;
export type AimLabScoreDto = z.infer<typeof AimLabScoreSchema>;
export type AimLabLeaderboardEntryDto = z.infer<
  typeof AimLabLeaderboardEntrySchema
>;
export type AimLabLeaderboardResponseDto = z.infer<
  typeof AimLabLeaderboardResponseSchema
>;
export type AimLabScoreResponseDto = z.infer<typeof AimLabScoreResponseSchema>;
export type AimLabSettingsDto = z.infer<typeof AimLabSettingsSchema>;
export type AimLabSettingsResponseDto = z.infer<
  typeof AimLabSettingsResponseSchema
>;
