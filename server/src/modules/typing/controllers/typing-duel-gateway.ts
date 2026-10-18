import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import { UserSessionsService } from '../../credentials/services/user-sessions-service';
import { TypingRepository } from '../repositories/typing-repository';
import {
  TypingDuelService,
  type DuelAck,
  type OnlinePlayerPush,
} from '../services/typing-duel-service';
import {
  DuelFinishSchema,
  DuelInviteRefSchema,
  DuelInviteResponseSchema,
  DuelInviteSchema,
  DuelProgressSchema,
  DuelVoteSchema,
} from '../validators/typing-duel-validator';

const userRoom = (userId: string) => `user:${userId}`;
const INVALID: DuelAck = { ok: false, message: 'Invalid request.' };

const userOf = (socket: Socket) => (socket.data as { userId?: string }).userId;

/**
 * Socket.IO namespace `/typing-duel`: typing-test 1v1s. The desktop opens it
 * while unlocked and connected (same `auth.token` as `/typing`), so everyone
 * online can be invited. Server pushes: `presence` (who else is online),
 * `invite` / `invite-closed`, `match` (the 1v1 as the receiver sees it, null
 * once they left) and `progress` (the opponent's caret). Every user's windows
 * share the room `user:{id}`. The rules live in TypingDuelService.
 */
@WebSocketGateway({ namespace: '/typing-duel', cors: { origin: '*' } })
export class TypingDuelGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() private readonly server!: Namespace;

  constructor(
    private readonly sessions: UserSessionsService,
    private readonly repository: TypingRepository,
    private readonly duels: TypingDuelService,
  ) {}

  afterInit(): void {
    this.duels.setEmitter({
      toUser: (userId, event, payload) =>
        this.server.to(userRoom(userId)).emit(event, payload),
    });
  }

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
    await socket.join(userRoom(userId));
    const player = await this.repository.findPlayer(userId);
    // Closed while the lookups ran: never joined, so never left either.
    if (!socket.connected) return;
    this.duels.join(userId, player?.name ?? null);
    (socket.data as { joined?: boolean }).joined = true;
  }

  handleDisconnect(socket: Socket): void {
    const userId = userOf(socket);
    // Only sockets that made it through handleConnection were counted.
    if (userId && (socket.data as { joined?: boolean }).joined)
      this.duels.leave(userId);
  }

  // who → the online list; re-reads the caller's name, which may have been picked since connecting
  @SubscribeMessage('who')
  async who(@ConnectedSocket() socket: Socket): Promise<OnlinePlayerPush[]> {
    const userId = userOf(socket);
    if (!userId) return [];
    const player = await this.repository.findPlayer(userId);
    this.duels.rename(userId, player?.name ?? null);
    return this.duels.players(userId);
  }

  // invite { userId } → { ok, inviteId?, message? }
  @SubscribeMessage('invite')
  async invite(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): Promise<DuelAck> {
    const userId = userOf(socket);
    const parsed = DuelInviteSchema.safeParse(body);
    if (!userId || !parsed.success) return INVALID;
    // The name may have been picked after connecting.
    const player = await this.repository.findPlayer(userId);
    this.duels.rename(userId, player?.name ?? null);
    return this.duels.invite(userId, parsed.data.userId);
  }

  // invite-cancel { inviteId } → { ok }
  @SubscribeMessage('invite-cancel')
  cancelInvite(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): DuelAck {
    const userId = userOf(socket);
    const parsed = DuelInviteRefSchema.safeParse(body);
    if (!userId || !parsed.success) return INVALID;
    return this.duels.cancelInvite(userId, parsed.data.inviteId);
  }

  // invite-respond { inviteId, accept } → { ok, message? }
  @SubscribeMessage('invite-respond')
  respond(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): DuelAck {
    const userId = userOf(socket);
    const parsed = DuelInviteResponseSchema.safeParse(body);
    if (!userId || !parsed.success) return INVALID;
    return this.duels.respond(userId, parsed.data.inviteId, parsed.data.accept);
  }

  // vote { option?, duration? } → { ok }
  @SubscribeMessage('vote')
  vote(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): DuelAck {
    const userId = userOf(socket);
    const parsed = DuelVoteSchema.safeParse(body);
    if (!userId || !parsed.success) return INVALID;
    return this.duels.vote(userId, parsed.data);
  }

  // progress { word, char, correct, wpm } — no ack; sent several times a second
  @SubscribeMessage('progress')
  progress(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): void {
    const userId = userOf(socket);
    const parsed = DuelProgressSchema.safeParse(body);
    if (userId && parsed.success) this.duels.progress(userId, parsed.data);
  }

  // finish { word, char, correct, wpm, accuracy } → { ok }
  @SubscribeMessage('finish')
  finish(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: unknown,
  ): DuelAck {
    const userId = userOf(socket);
    const parsed = DuelFinishSchema.safeParse(body);
    if (!userId || !parsed.success) return INVALID;
    return this.duels.finish(userId, parsed.data);
  }

  // rematch → { ok }
  @SubscribeMessage('rematch')
  rematch(@ConnectedSocket() socket: Socket): DuelAck {
    const userId = userOf(socket);
    return userId ? this.duels.rematch(userId) : INVALID;
  }

  // leave → { ok }; ends the 1v1 for both
  @SubscribeMessage('leave')
  leave(@ConnectedSocket() socket: Socket): DuelAck {
    const userId = userOf(socket);
    return userId ? this.duels.leaveMatch(userId) : INVALID;
  }
}
