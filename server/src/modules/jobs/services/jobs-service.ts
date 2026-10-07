import { Injectable } from '@nestjs/common';
import {
  NpaxJobLookup,
  NpaxWorkflowClient,
} from '../../../infrastructures/npax-workflow/npax-workflow-client';

/** How long a user's Job lookup is reused before N-PAX is read again. */
const JOBS_CACHE_MS = 60 * 60 * 1000;

@Injectable()
export class JobsService {
  // Reading the lookup drives the site through every cost center, so each
  // user's copy is kept for an hour; `refresh` reads it again. Keyed by user.
  private readonly cache = new Map<
    string,
    { lookup: NpaxJobLookup; expiresAt: number }
  >();

  constructor(private readonly npax: NpaxWorkflowClient) {}

  async list(user: string, refresh: boolean): Promise<NpaxJobLookup> {
    const cached = this.cache.get(user);
    if (!refresh && cached && cached.expiresAt > Date.now()) {
      return cached.lookup;
    }
    const lookup = await this.npax.getJobs(user);
    this.cache.set(user, { lookup, expiresAt: Date.now() + JOBS_CACHE_MS });
    return lookup;
  }
}
