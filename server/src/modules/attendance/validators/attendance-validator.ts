import { z } from 'zod';
import { DateKeySchema } from '../../log-entries/validators/log-entries-validator';

export const TimeInQuerySchema = z.object({ date: DateKeySchema }).strict();
