import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { UserSessionsService } from '../../credentials/services/user-sessions-service';
import type { TetrisLeaderboardEntryDto } from '../dto/tetris-dto';
import { TetrisLeaderboardQuerySchema } from '../validators/tetris-validator';

const roomFor = (setup: string) => `setup:${setup}`;

/** What the server pushes on `leaderboard`: one start level's top players, as the receiving user sees them. */
export interface TetrisLeaderboardPush {
  setup: string;
  entries: TetrisLeaderboardEntryDto[];
}

/**
 * Socket.IO namespace `/tetris`: pushes a start level's leaderboard to every
 * desktop watching it whenever someone sets a new best there. Same handshake as
 * `/typing`: the session token as `auth.token`, then `subscribe { setup }`.
 */
@WebSocketGateway({ namespace: '/tetris', cors: { origin: '*' } })
export class TetrisGateway implements OnGatewayConnection {
  private readonly logger = new Logger(TetrisGateway.name);

  @WebSocketServer() private readonly server!: Namespace;

  constructor(private readonly sessions: UserSessionsService) {}

  async handleConnection(socket: Socket): Promise<void> {
    const auth = socket.handshake.auth as { token?: unknown } | undefined;
    const token = typeof auth?.token === 'string' ? auth.token : '';
    const userId = token ? await this.sessions.findUser(token) : null;
    if (!userId) {
      socket.emit('unauthorized', { message: 'Connect to N-PAX first.' });
      socket.disconnect(true);
      return;
    }
    (socket.data as { userId?: string }).userId = userId;
  }

  // subscribe { setup } → { ok }; watches that start level's board, and only that one
  @SubscribeMessage('subscribe')
  async subscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): Promise<{ ok: boolean }> {
    const parsed = TetrisLeaderboardQuerySchema.safeParse(body);
    if (!parsed.success) return { ok: false };
    for (const room of socket.rooms) {
      if (room.startsWith('setup:')) await socket.leave(room);
    }
    await socket.join(roomFor(parsed.data.setup));
    return { ok: true };
  }

  /** Sends the start level's board to each watcher, built for that watcher (their own row flagged). */
  async pushBoard(
    setup: string,
    build: (userId: string) => TetrisLeaderboardEntryDto[],
  ): Promise<void> {
    try {
      const sockets = await this.server.in(roomFor(setup)).fetchSockets();
      for (const socket of sockets) {
        const userId = (socket.data as { userId?: string }).userId;
        if (!userId) continue;
        const push: TetrisLeaderboardPush = { setup, entries: build(userId) };
        socket.emit('leaderboard', push);
      }
    } catch (error) {
      // A failed push only delays the board until the next fetch; the score is saved.
      this.logger.warn(
        `Tetris leaderboard push for ${setup} failed: ${String(error)}`,
      );
    }
  }
}
