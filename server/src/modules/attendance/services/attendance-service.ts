import { Injectable } from '@nestjs/common';
import { NpaxWorkflowClient } from '../../../infrastructures/npax-workflow/npax-workflow-client';

@Injectable()
export class AttendanceService {
  // Past days' time-in never changes, so each one is scraped at most once.
  private readonly pastTimeIns = new Map<string, string | null>();

  constructor(private readonly npax: NpaxWorkflowClient) {}

  async getTimeIn(
    date: string,
  ): Promise<{ date: string; timeIn: string | null }> {
    const cached = this.pastTimeIns.get(date);
    if (cached !== undefined) return { date, timeIn: cached };

    const [year, month, day] = date.split('-').map(Number);
    const timeIn = await this.npax.getTimeIn(new Date(year, month - 1, day));

    const today = new Date().toLocaleDateString('en-CA');
    if (date < today) this.pastTimeIns.set(date, timeIn);
    return { date, timeIn };
  }
}
