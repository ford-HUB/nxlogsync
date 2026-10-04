import type { Request } from 'express';

/** A request after SessionAuthGuard: `userId` is set when a valid session token came with it. */
export interface AuthenticatedRequest extends Request {
  /** The signed-in user's key (see toUserKey). */
  userId?: string;
}
