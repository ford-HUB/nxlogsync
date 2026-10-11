import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '../../../infrastructures/prisma/common/client';
import { TypingGateway } from '../controllers/typing-gateway';
import {
  LeaderboardEntryDto,
  LeaderboardResponseDto,
  NameAvailabilityResponseDto,
  TypingPlayerResponseDto,
  TypingScoreDto,
  TypingScoreResponseDto,
} from '../dto/typing-dto';
import {
  TypingRepository,
  TypingScoreWithName,
} from '../repositories/typing-repository';
import { LEADERBOARD_SIZE } from '../validators/typing-validator';

const NAME_TAKEN_MESSAGE = 'That name is taken. Try another one.';

/** A name as compared for uniqueness: trimmed, lowercased and single-spaced. */
const toNameKey = (name: string) =>
  name.trim().replace(/\s+/g, ' ').toLowerCase();

const toEntries = (
  top: TypingScoreWithName[],
  userId: string,
): LeaderboardEntryDto[] =>
  top.map((s) => ({
    id: s.id,
    name: s.player.name,
    wpm: s.wpm,
    accuracy: s.accuracy,
    you: s.userId === userId,
  }));

/**
 * The typing-test leaderboard: each user picks a name once, and only their best
 * run per exact test setup is kept and ranked. A new best is pushed live to
 * everyone watching that setup (see TypingGateway).
 */
@Injectable()
export class TypingService {
  constructor(
    private readonly repository: TypingRepository,
    private readonly gateway: TypingGateway,
  ) {}

  async getPlayer(userId: string): Promise<TypingPlayerResponseDto> {
    const player = await this.repository.findPlayer(userId);
    return { name: player?.name ?? null };
  }

  /** Whether a name is free for this user; their own current name counts as free. */
  async nameAvailable(
    userId: string,
    name: string,
  ): Promise<NameAvailabilityResponseDto> {
    const owner = await this.repository.findPlayerByNameKey(toNameKey(name));
    return { available: !owner || owner.userId === userId };
  }

  async savePlayer(
    userId: string,
    name: string,
  ): Promise<TypingPlayerResponseDto> {
    const display = name.trim().replace(/\s+/g, ' ');
    if (!(await this.nameAvailable(userId, display)).available) {
      throw new ConflictException(NAME_TAKEN_MESSAGE);
    }
    try {
      const player = await this.repository.savePlayer(
        userId,
        display,
        toNameKey(display),
      );
      return { name: player.name };
    } catch (error) {
      // Someone else took it between the check and the save.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(NAME_TAKEN_MESSAGE);
      }
      throw error;
    }
  }

  async leaderboard(
    userId: string,
    setup: string,
  ): Promise<LeaderboardResponseDto> {
    const top = await this.repository.top(setup, LEADERBOARD_SIZE);
    const entries = toEntries(top, userId);

    const index = top.findIndex((s) => s.userId === userId);
    if (index >= 0) {
      const { wpm, accuracy } = top[index];
      return { setup, entries, you: { rank: index + 1, wpm, accuracy } };
    }
    const own = await this.repository.findScore(userId, setup);
    if (!own) return { setup, entries, you: null };
    const rank = (await this.repository.countFaster(setup, own.wpm)) + 1;
    return {
      setup,
      entries,
      you: { rank, wpm: own.wpm, accuracy: own.accuracy },
    };
  }

  /** Keeps the run when it beats the user's best for the setup; returns the board after. */
  async submitScore(
    userId: string,
    data: TypingScoreDto,
  ): Promise<TypingScoreResponseDto> {
    if (!(await this.repository.findPlayer(userId))) {
      throw new BadRequestException(
        'Pick a leaderboard name before saving a score.',
      );
    }
    const best = await this.repository.findScore(userId, data.setup);
    const personalBest = !best || data.wpm > best.wpm;
    if (!personalBest) {
      return { ...(await this.leaderboard(userId, data.setup)), personalBest };
    }
    await this.repository.saveScore(userId, data);
    const board = await this.leaderboard(userId, data.setup);
    // Same top 100 for every watcher; only the `you` flag differs per user.
    const top = await this.repository.top(data.setup, LEADERBOARD_SIZE);
    void this.gateway.pushBoard(data.setup, (watcher) =>
      toEntries(top, watcher),
    );
    return { ...board, personalBest };
  }
}
