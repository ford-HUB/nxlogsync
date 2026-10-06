import { z } from 'zod';
import {
  CreateLogEntrySchema,
  ListLogEntriesQuerySchema,
  LogEntryResponseSchema,
  ResyncDaysSchema,
  UpdateLogEntrySchema,
} from '../validators/log-entries-validator';

export type CreateLogEntryDto = z.infer<typeof CreateLogEntrySchema>;
export type UpdateLogEntryDto = z.infer<typeof UpdateLogEntrySchema>;
export type ListLogEntriesQueryDto = z.infer<typeof ListLogEntriesQuerySchema>;
export type ResyncDaysDto = z.infer<typeof ResyncDaysSchema>;
export type LogEntryResponseDto = z.infer<typeof LogEntryResponseSchema>;
