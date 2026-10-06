import { z } from 'zod';
import { TimeInQuerySchema } from '../validators/attendance-validator';

export type TimeInQueryDto = z.infer<typeof TimeInQuerySchema>;
