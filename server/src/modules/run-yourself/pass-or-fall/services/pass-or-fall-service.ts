import { Injectable } from '@nestjs/common';
import {
  PassOrFallLeaderboardResponseDto,
  PassOrFallProgressDto,
  PassOrFallProgressResponseDto,
  PassOrFallScoreDto,
  PassOrFallScoreResponseDto,
} from '../dto/pass-or-fall-dto';
import { PassOrFallRepository } from '../repositories/pass-or-fall-repository';
import { PASS_OR_FALL_LEADERBOARD_SIZE } from '../validators/pass-or-fall-validator';

/**
 * Pass or fall: where each user's Continue resumes (the furthest door they have unlocked, which
 * only moves forward; a new game never takes it back) and the leaderboard of best runs, under the
 * name picked for the typing test. Players without a name keep their best but aren't listed.
 */
@Injectable()
export class PassOrFallService {
  constructor(private readonly repository: PassOrFallRepository) {}

  async progress(userId: string): Promise<PassOrFallProgressResponseDto> {
    const row = await this.repository.find(userId);
    // A row made only by a run that ended before any door has nothing to continue.
    if (!row || row.level === 0) return { progress: null };
    const { level, points, seconds } = row;
    return { progress: { level, points, seconds } };
  }

  /** Saves a newly unlocked door, unless the user has already been further (or as far with more points). */
  async saveProgress(
    userId: string,
    data: PassOrFallProgressDto,
  ): Promise<PassOrFallProgressResponseDto> {
    const row = await this.repository.find(userId);
    const further =
      !row ||
      data.level > row.level ||
      (data.level === row.level && data.points > row.points);
    if (further) await this.repository.saveProgress(userId, data);
    return await this.progress(userId);
  }

  async leaderboard(userId: string): Promise<PassOrFallLeaderboardResponseDto> {
    // Over-fetch, since unnamed players drop out of the list.
    const top = await this.repository.top(PASS_OR_FALL_LEADERBOARD_SIZE * 2);
    const names = new Map(
      (await this.repository.players(top.map((r) => r.userId))).map((p) => [
        p.userId,
        p.name,
      ]),
    );
    const entries = top
      .filter((r) => names.has(r.userId))
      .slice(0, PASS_OR_FALL_LEADERBOARD_SIZE)
      .map((r) => ({
        id: r.userId,
        name: names.get(r.userId) ?? '',
        points: r.bestPoints ?? 0,
        levels: r.bestLevels ?? 0,
        seconds: r.bestSeconds ?? 0,
        you: r.userId === userId,
      }));

    const own = await this.repository.find(userId);
    if (!own || own.bestPoints === null) return { entries, you: null };
    const points = own.bestPoints;
    const seconds = own.bestSeconds ?? 0;
    const listed = entries.findIndex((e) => e.you);
    const rank =
      listed >= 0
        ? listed + 1
        : (await this.repository.countAhead(points, seconds)) + 1;
    return {
      entries,
      you: { rank, points, levels: own.bestLevels ?? 0, seconds },
    };
  }

  /** Keeps the run when it beats the user's best (more points, or as many and faster); returns the board after. */
  async submitScore(
    userId: string,
    data: PassOrFallScoreDto,
  ): Promise<PassOrFallScoreResponseDto> {
    const own = await this.repository.find(userId);
    const best = own?.bestPoints ?? null;
    const personalBest =
      best === null ||
      data.points > best ||
      (data.points === best && data.seconds < (own?.bestSeconds ?? Infinity));
    if (personalBest) await this.repository.saveBest(userId, data);
    return { ...(await this.leaderboard(userId)), personalBest };
  }
}
