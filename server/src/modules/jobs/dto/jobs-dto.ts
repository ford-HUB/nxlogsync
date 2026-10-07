import { z } from 'zod';
import { ListJobsQuerySchema } from '../validators/jobs-validator';

export type ListJobsQueryDto = z.infer<typeof ListJobsQuerySchema>;
