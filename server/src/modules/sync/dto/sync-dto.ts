import { z } from 'zod';
import {
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
export type SyncTrigger = (typeof RUN_TRIGGERS)[number];
export type SyncRunStatus = (typeof RUN_STATUSES)[number];
