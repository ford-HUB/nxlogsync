import { z } from 'zod';

export const ListJobsQuerySchema = z
  .object({
    /** "true" skips the cached copy and reads the lookup from N-PAX again. */
    refresh: z.enum(['true', 'false']).optional(),
  })
  .strict();
