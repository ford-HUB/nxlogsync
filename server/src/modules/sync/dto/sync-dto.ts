import { z } from 'zod';
import {
  ENDORSE_OUTCOMES,
  EndorseDayResponseSchema,
  EndorseDaySchema,
  ListSyncRunsQuerySchema,
  PendingUploadResponseSchema,
  RUN_STATUSES,
  RUN_TRIGGERS,
  SyncRunResponseSchema,
  SyncScheduleSchema,
} from '../validators/sync-validator';

export type SyncScheduleDto = z.infer<typeof SyncScheduleSchema>;
export type ListSyncRunsQueryDto = z.infer<typeof ListSyncRunsQuerySchema>;
export type SyncRunResponseDto = z.infer<typeof SyncRunResponseSchema>;
export type PendingUploadResponseDto = z.infer<
  typeof PendingUploadResponseSchema
>;
export type EndorseDayDto = z.infer<typeof EndorseDaySchema>;
export type EndorseDayResponseDto = z.infer<typeof EndorseDayResponseSchema>;
export type EndorseOutcome = (typeof ENDORSE_OUTCOMES)[number];
export type SyncTrigger = (typeof RUN_TRIGGERS)[number];
export type SyncRunStatus = (typeof RUN_STATUSES)[number];
