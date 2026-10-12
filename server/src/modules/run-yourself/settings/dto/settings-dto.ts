import { z } from 'zod';
import {
  RunSettingsResponseSchema,
  RunSettingsSchema,
} from '../validators/settings-validator';

export type RunSettingsDto = z.infer<typeof RunSettingsSchema>;
export type RunSettingsResponseDto = z.infer<typeof RunSettingsResponseSchema>;
