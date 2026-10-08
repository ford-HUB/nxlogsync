import { z } from 'zod';
import {
  ReminderSettingsResponseSchema,
  ReminderSettingsSchema,
} from '../validators/reminders-validator';

export type ReminderSettingsDto = z.infer<typeof ReminderSettingsSchema>;
export type ReminderSettingsResponseDto = z.infer<
  typeof ReminderSettingsResponseSchema
>;
