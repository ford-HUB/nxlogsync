import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * The signed-in user's key. Always set on protected routes; on a `@Public()`
 * route it is null when no valid session token was sent.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null =>
    ctx.switchToHttp().getRequest<AuthenticatedRequest>().userId ?? null,
);
