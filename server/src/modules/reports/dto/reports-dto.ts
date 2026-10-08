import { z } from 'zod';
import {
  EntriesReportQuerySchema,
  EntriesReportResponseSchema,
  ReportEntrySchema,
  ReportMonthSchema,
} from '../validators/reports-validator';

export type EntriesReportQueryDto = z.infer<typeof EntriesReportQuerySchema>;
export type ReportEntryDto = z.infer<typeof ReportEntrySchema>;
export type ReportMonthDto = z.infer<typeof ReportMonthSchema>;
export type EntriesReportDto = z.infer<typeof EntriesReportResponseSchema>;
