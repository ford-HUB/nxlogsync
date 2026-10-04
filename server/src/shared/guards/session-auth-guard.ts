import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserSessionsService } from '../../modules/credentials/services/user-sessions-service';
import { IS_PUBLIC_KEY } from '../decorators/public-decorator';
import type { AuthenticatedRequest } from '../types/authenticated-request';

/**
 * Global guard: resolves the `Authorization: Bearer <token>` issued by Connect
 * to the user it belongs to. Every route needs one unless marked `@Public()`;
 * public routes still get `userId` when a valid token is sent.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: UserSessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (token) {
      const userId = await this.sessions.findUser(token);
      if (userId) request.userId = userId;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic || request.userId) return true;
    throw new UnauthorizedException('Connect to N-PAX first.');
  }
}
