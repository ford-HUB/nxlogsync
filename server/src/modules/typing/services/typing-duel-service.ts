import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ENGLISH_200 } from '../../../shared/constants/typing-words';
import type {
  DuelDurationDto,
  DuelFinishDto,
  DuelLeaderboardEntryDto,
  DuelLeaderboardResponseDto,
  DuelOptionDto,
  DuelProgressDto,
  DuelVoteDto,
} from '../dto/typing-duel-dto';
import {
  TypingDuelRecordWithName,
  TypingRepository,
} from '../repositories/typing-repository';
import { LEADERBOARD_SIZE } from '../validators/typing-validator';

const toDuelEntries = (
  top: TypingDuelRecordWithName[],
  userId: string,
): DuelLeaderboardEntryDto[] =>
  top.map((r) => ({
    id: r.userId,
    name: r.player.name,
    points: r.wins,
    wins: r.wins,
    losses: r.losses,
    draws: r.draws,
    you: r.userId === userId,
  }));

/** How long an invite waits for an answer before it expires. */
const INVITE_TTL_MS = 15_000;
/** The 3‑2‑1 between agreeing on a race and the first key. */
const COUNTDOWN_MS = 3_000;
/** A race still takes finish reports this long after its time runs out. */
const TIME_GRACE_MS = 2_500;
/** Words dealt per second of a timed race: more than anyone types (180 wpm). */
const TIME_RACE_WORDS_PER_SECOND = 3;

export interface DuelConfig {
  mode: 'time' | 'words';
  /** Seconds for a time race, words for a words race. */
  amount: number;
  /** Seconds the race lasts at most: the voted time. */
  limit: number;
}

/** Words per words race; Speed is a time race as long as the voted time. */
const DUEL_WORDS: Record<Exclude<DuelOptionDto, 'speed'>, number> = {
  short: 10,
  medium: 25,
  long: 50,
};

const raceConfig = (
  option: DuelOptionDto,
  duration: DuelDurationDto,
): DuelConfig =>
  option === 'speed'
    ? { mode: 'time', amount: duration, limit: duration }
    : { mode: 'words', amount: DUEL_WORDS[option], limit: duration };

export type DuelPhase =
  'voting' | 'countdown' | 'racing' | 'finished' | 'closed';

/** One entry of `presence`: someone online with a leaderboard name. */
export interface OnlinePlayerPush {
  userId: string;
  name: string;
  /** In a 1v1 already, so they can't be invited. */
  busy: boolean;
  /** Who they're racing while busy. */
  opponent: string | null;
}

/** `invite`: someone challenges the receiving user. */
export interface InvitePush {
  id: string;
  from: { userId: string; name: string };
  expiresInMs: number;
}

export type InviteClosedReason =
  'accepted' | 'declined' | 'cancelled' | 'expired' | 'busy' | 'offline';

/** `invite-closed`: an invite either side was waiting on is over. */
export interface InviteClosedPush {
  id: string;
  reason: InviteClosedReason;
}

export interface DuelResult {
  wpm: number;
  accuracy: number;
  correct: number;
}

export interface DuelPlayerPush {
  userId: string;
  name: string;
  vote: DuelOptionDto | null;
  durationVote: DuelDurationDto | null;
  /** Races won in this 1v1. */
  points: number;
  /** Asked for another race after this one. */
  rematch: boolean;
  /** Set once their client reports the race finished. */
  result: DuelResult | null;
  progress: DuelProgressDto;
}

/** `match`: the 1v1 as the receiving user sees it, sent on every change but progress. */
export interface MatchPush {
  id: string;
  /** 1 for the first race, +1 per rematch. */
  round: number;
  phase: DuelPhase;
  option: DuelOptionDto | null;
  config: DuelConfig | null;
  /** The race's words from the countdown on; empty while voting. */
  words: string[];
  /** Left of the countdown when phase is 'countdown'. */
  countdownMs: number;
  you: DuelPlayerPush;
  opponent: DuelPlayerPush;
  winner: 'you' | 'opponent' | 'draw' | null;
  /** Why a 'closed' match ended: the opponent left mid-race (a forfeit) or between races. */
  closedReason: DuelClosedReason | null;
}

export type DuelClosedReason = 'left' | 'forfeit';

export interface DuelAck {
  ok: boolean;
  message?: string;
  inviteId?: string;
  /** Left on a sent invite, for the sender's countdown. */
  expiresInMs?: number;
}

/** How the service reaches a user's open windows; the gateway provides it. */
export interface DuelEmitter {
  toUser(userId: string, event: string, payload: unknown): void;
}

interface Member {
  userId: string;
  /** Leaderboard name; null until picked, and unlisted until then. */
  name: string | null;
  /** Open connections (windows) for the user. */
  sockets: number;
}

interface Invite {
  id: string;
  from: string;
  to: string;
  expiresAt: number;
  timer: NodeJS.Timeout;
}

interface Racer {
  userId: string;
  name: string;
  vote: DuelOptionDto | null;
  durationVote: DuelDurationDto | null;
  points: number;
  rematch: boolean;
  result: DuelResult | null;
  progress: DuelProgressDto;
}

interface Match {
  id: string;
  round: number;
  phase: DuelPhase;
  option: DuelOptionDto | null;
  config: DuelConfig | null;
  words: string[];
  racers: [Racer, Racer];
  countdownEndsAt: number;
  /** Undefined until decided; null for a draw. */
  winnerId: string | null | undefined;
  closedReason: DuelClosedReason | null;
  timer?: NodeJS.Timeout;
}

const startProgress = (): DuelProgressDto => ({
  word: 0,
  char: 0,
  correct: 0,
  wpm: 0,
});

const pick = <T>(list: readonly T[]) =>
  list[Math.floor(Math.random() * list.length)];

/** Random words, never the same word twice in a row (the desktop's rule too). */
function dealWords(count: number): string[] {
  const words: string[] = [];
  while (words.length < count) {
    const word = pick(ENGLISH_200);
    if (word !== words[words.length - 1]) words.push(word);
  }
  return words;
}

/**
 * Typing-test 1v1s, kept in memory: who is online (with the typing socket open),
 * invites between them, and each match from voting on a race through the
 * countdown, the race and rematches. A server restart drops every match; the
 * clients reconnect and find themselves in none.
 */
@Injectable()
export class TypingDuelService implements OnModuleDestroy {
  private readonly logger = new Logger(TypingDuelService.name);
  private emitter: DuelEmitter | null = null;
  private readonly members = new Map<string, Member>();
  private readonly invites = new Map<string, Invite>();
  private readonly matches = new Map<string, Match>();
  /** userId → the match they are in. */
  private readonly matchOf = new Map<string, string>();

  constructor(private readonly repository: TypingRepository) {}

  setEmitter(emitter: DuelEmitter): void {
    this.emitter = emitter;
  }

  onModuleDestroy(): void {
    for (const invite of this.invites.values()) clearTimeout(invite.timer);
    for (const match of this.matches.values()) clearTimeout(match.timer);
  }

  // ── presence ──────────────────────────────────────────────

  /** A window opened the socket; it gets the list, its pending invites and its match. */
  join(userId: string, name: string | null): void {
    const member = this.members.get(userId);
    if (member) {
      member.sockets++;
      member.name = name ?? member.name;
    } else {
      this.members.set(userId, { userId, name, sockets: 1 });
    }
    this.broadcastPresence();
    for (const invite of this.invites.values()) {
      if (invite.to === userId) this.emitInvite(invite);
    }
    // Null too, so a client still showing a match the server lost (a restart) lets it go.
    const match = this.findMatch(userId);
    if (match) this.emitMatch(match);
    else this.emitter?.toUser(userId, 'match', null);
  }

  /** A window closed; the last one leaving takes the user offline and out of their match. */
  leave(userId: string): void {
    const member = this.members.get(userId);
    if (!member) return;
    member.sockets--;
    if (member.sockets > 0) return;
    this.members.delete(userId);
    for (const invite of [...this.invites.values()]) {
      if (invite.from === userId || invite.to === userId)
        this.closeInvite(invite, 'offline');
    }
    this.leaveMatch(userId);
    this.broadcastPresence();
  }

  /** The leaderboard name was (re)read, e.g. picked after the socket opened. */
  rename(userId: string, name: string | null): void {
    const member = this.members.get(userId);
    if (!member || member.name === name) return;
    member.name = name;
    this.broadcastPresence();
  }

  /** Everyone else online with a name: free to invite first, then those in a 1v1; by name. */
  players(userId: string): OnlinePlayerPush[] {
    return [...this.members.values()]
      .filter((m) => m.userId !== userId && m.name !== null)
      .map((m) => {
        const match = this.findMatch(m.userId);
        return {
          userId: m.userId,
          name: m.name as string,
          busy: match !== undefined,
          opponent: match ? this.opponent(match, m.userId).name : null,
        };
      })
      .sort(
        (a, b) =>
          Number(a.busy) - Number(b.busy) || a.name.localeCompare(b.name),
      );
  }

  // ── invites ───────────────────────────────────────────────

  invite(from: string, to: string): DuelAck {
    const sender = this.members.get(from);
    const receiver = this.members.get(to);
    if (!sender?.name)
      return { ok: false, message: 'Pick a leaderboard name first.' };
    if (from === to) return { ok: false, message: "You can't race yourself." };
    if (!receiver?.name)
      return { ok: false, message: 'They are not online anymore.' };
    if (this.matchOf.has(from))
      return { ok: false, message: 'Finish your current 1v1 first.' };
    if (this.matchOf.has(to))
      return { ok: false, message: 'They are in a 1v1 right now.' };
    for (const invite of this.invites.values()) {
      if (invite.from === from && invite.to === to)
        return {
          ok: true,
          inviteId: invite.id,
          expiresInMs: Math.max(0, invite.expiresAt - Date.now()),
        };
    }
    const id = randomUUID();
    const invite: Invite = {
      id,
      from,
      to,
      expiresAt: Date.now() + INVITE_TTL_MS,
      timer: setTimeout(() => {
        const current = this.invites.get(id);
        if (current) this.closeInvite(current, 'expired');
      }, INVITE_TTL_MS),
    };
    this.invites.set(id, invite);
    this.emitInvite(invite);
    return { ok: true, inviteId: id, expiresInMs: INVITE_TTL_MS };
  }

  cancelInvite(userId: string, inviteId: string): DuelAck {
    const invite = this.invites.get(inviteId);
    if (invite?.from === userId) this.closeInvite(invite, 'cancelled');
    return { ok: true };
  }

  respond(userId: string, inviteId: string, accept: boolean): DuelAck {
    const invite = this.invites.get(inviteId);
    if (!invite || invite.to !== userId)
      return { ok: false, message: 'That invite is no longer open.' };
    if (!accept) {
      this.closeInvite(invite, 'declined');
      return { ok: true };
    }
    const a = this.members.get(invite.from);
    const b = this.members.get(invite.to);
    if (!a?.name || !b?.name) {
      this.closeInvite(invite, 'offline');
      return { ok: false, message: 'They are not online anymore.' };
    }
    if (this.matchOf.has(a.userId) || this.matchOf.has(b.userId)) {
      this.closeInvite(invite, 'busy');
      return { ok: false, message: 'They are in a 1v1 right now.' };
    }

    this.closeInvite(invite, 'accepted');
    // Either of them is taken now; every other invite involving them is off.
    for (const other of [...this.invites.values()]) {
      if ([other.from, other.to].some((u) => u === a.userId || u === b.userId))
        this.closeInvite(other, 'busy');
    }

    const racer = (m: Member): Racer => ({
      userId: m.userId,
      name: m.name as string,
      vote: null,
      durationVote: null,
      points: 0,
      rematch: false,
      result: null,
      progress: startProgress(),
    });
    const match: Match = {
      id: randomUUID(),
      round: 1,
      phase: 'voting',
      option: null,
      config: null,
      words: [],
      racers: [racer(a), racer(b)],
      countdownEndsAt: 0,
      winnerId: undefined,
      closedReason: null,
    };
    this.matches.set(match.id, match);
    this.matchOf.set(a.userId, match.id);
    this.matchOf.set(b.userId, match.id);
    this.emitMatch(match);
    this.broadcastPresence();
    return { ok: true };
  }

  // ── the match ─────────────────────────────────────────────

  /**
   * A vote on the race and/or the time while picking; once both agree on both
   * the countdown starts, and a change stops it.
   */
  vote(userId: string, vote: DuelVoteDto): DuelAck {
    const match = this.findMatch(userId);
    if (!match || (match.phase !== 'voting' && match.phase !== 'countdown'))
      return { ok: false, message: 'Voting is closed.' };
    const racer = this.racer(match, userId);
    if (vote.option) racer.vote = vote.option;
    if (vote.duration) racer.durationVote = vote.duration;

    const [a, b] = match.racers;
    const agreed =
      a.vote &&
      a.vote === b.vote &&
      a.durationVote &&
      a.durationVote === b.durationVote;
    if (agreed) {
      if (
        match.phase !== 'countdown' ||
        match.option !== a.vote ||
        match.config?.limit !== a.durationVote
      )
        this.startCountdown(match, a.vote!, a.durationVote!);
    } else if (match.phase === 'countdown') {
      clearTimeout(match.timer);
      Object.assign(match, {
        phase: 'voting',
        option: null,
        config: null,
        words: [],
      });
    }
    this.emitMatch(match);
    return { ok: true };
  }

  /** Relays a racer's caret to their opponent; not echoed back or kept beyond the latest. */
  progress(userId: string, progress: DuelProgressDto): void {
    const match = this.findMatch(userId);
    if (!match || match.phase !== 'racing') return;
    this.racer(match, userId).progress = progress;
    this.emitter?.toUser(
      this.opponent(match, userId).userId,
      'progress',
      progress,
    );
  }

  /**
   * A racer's client finished. In a words race the first through every word
   * wins; otherwise, once the time is up, both reports (or the time plus grace)
   * decide it on correct characters. A report after the race is decided just
   * fills in the result.
   */
  finish(userId: string, report: DuelFinishDto): DuelAck {
    const match = this.findMatch(userId);
    if (!match || (match.phase !== 'racing' && match.phase !== 'finished'))
      return { ok: false };
    const racer = this.racer(match, userId);
    if (racer.result) return { ok: true };
    const { accuracy, ...progress } = report;
    racer.progress = progress;
    racer.result = { wpm: report.wpm, accuracy, correct: report.correct };

    if (match.phase === 'racing' && match.config) {
      // Finishing every word wins a words race outright.
      if (match.config.mode === 'words' && report.word >= match.words.length) {
        this.decide(match, userId);
        return { ok: true };
      }
      // Both stopped by the clock: decided on correct characters.
      if (match.racers.every((r) => r.result)) {
        this.decideOnProgress(match);
        return { ok: true };
      }
    }
    this.emitMatch(match);
    return { ok: true };
  }

  /** Asks for another race; when both have, it is back to voting with the points kept. */
  rematch(userId: string): DuelAck {
    const match = this.findMatch(userId);
    if (!match || match.phase !== 'finished') return { ok: false };
    this.racer(match, userId).rematch = true;
    if (match.racers.every((r) => r.rematch)) {
      Object.assign(match, {
        round: match.round + 1,
        phase: 'voting',
        option: null,
        config: null,
        words: [],
        winnerId: undefined,
      });
      for (const r of match.racers) {
        Object.assign(r, {
          vote: null,
          durationVote: null,
          rematch: false,
          result: null,
          progress: startProgress(),
        });
      }
    }
    this.emitMatch(match);
    return { ok: true };
  }

  /** Leaving (or going offline) ends the match for both; mid-race that is a forfeit. */
  leaveMatch(userId: string): DuelAck {
    const match = this.findMatch(userId);
    if (!match) return { ok: true };
    clearTimeout(match.timer);
    // Leaving once the words are dealt abandons that race; it counts for neither side.
    match.closedReason =
      match.phase === 'countdown' || match.phase === 'racing'
        ? 'forfeit'
        : 'left';
    match.phase = 'closed';
    this.emitter?.toUser(
      this.opponent(match, userId).userId,
      'match',
      this.view(match, this.opponent(match, userId).userId),
    );
    this.emitter?.toUser(userId, 'match', null);
    this.matches.delete(match.id);
    for (const r of match.racers) this.matchOf.delete(r.userId);
    this.broadcastPresence();
    return { ok: true };
  }

  // ── internals ─────────────────────────────────────────────

  private startCountdown(
    match: Match,
    option: DuelOptionDto,
    duration: DuelDurationDto,
  ): void {
    clearTimeout(match.timer);
    const config = raceConfig(option, duration);
    Object.assign(match, {
      phase: 'countdown',
      option,
      config,
      words: dealWords(
        config.mode === 'words'
          ? config.amount
          : config.limit * TIME_RACE_WORDS_PER_SECOND,
      ),
      countdownEndsAt: Date.now() + COUNTDOWN_MS,
    });
    match.timer = setTimeout(() => this.startRace(match), COUNTDOWN_MS);
  }

  private startRace(match: Match): void {
    if (!this.matches.has(match.id) || !match.config) return;
    match.phase = 'racing';
    // Each client stops itself when the time is up; the grace covers its report.
    match.timer = setTimeout(
      () => this.decideOnProgress(match),
      match.config.limit * 1000 + TIME_GRACE_MS,
    );
    this.emitMatch(match);
  }

  /** More correct characters wins; level is a draw. */
  private decideOnProgress(match: Match): void {
    if (match.phase !== 'racing') return;
    const [a, b] = match.racers.map(
      (r) => r.result?.correct ?? r.progress.correct,
    );
    this.decide(
      match,
      a === b ? null : a > b ? match.racers[0].userId : match.racers[1].userId,
    );
  }

  private decide(match: Match, winnerId: string | null): void {
    clearTimeout(match.timer);
    match.phase = 'finished';
    match.winnerId = winnerId;
    if (winnerId) this.racer(match, winnerId).points++;
    this.emitMatch(match);
    void this.record(match, winnerId);
  }

  // ── the 1v1 leaderboard ───────────────────────────────────

  /** The players with the most races won, and the user's own record. */
  async leaderboard(userId: string): Promise<DuelLeaderboardResponseDto> {
    const top = await this.repository.duelTop(LEADERBOARD_SIZE);
    const entries = toDuelEntries(top, userId);
    const own = await this.repository.findDuelRecord(userId);
    if (!own) return { entries, you: null };
    const index = top.findIndex((r) => r.userId === userId);
    const rank =
      index >= 0
        ? index + 1
        : (await this.repository.countDuelAhead(own.wins, own.losses)) + 1;
    const { wins, losses, draws } = own;
    return { entries, you: { rank, points: wins, wins, losses, draws } };
  }

  /**
   * Saves a decided race to both records, then pushes the board to everyone
   * online: the two racers get theirs whole, everyone else the new top.
   */
  private async record(match: Match, winnerId: string | null): Promise<void> {
    const [a, b] = match.racers;
    const field = (r: Racer) =>
      winnerId === null ? 'draws' : r.userId === winnerId ? 'wins' : 'losses';
    try {
      await this.repository.recordDuel(
        { userId: a.userId, field: field(a) },
        { userId: b.userId, field: field(b) },
      );
      const top = await this.repository.duelTop(LEADERBOARD_SIZE);
      for (const member of this.members.values()) {
        if (member.userId === a.userId || member.userId === b.userId) continue;
        this.emitter?.toUser(member.userId, 'leaderboard', {
          entries: toDuelEntries(top, member.userId),
        });
      }
      for (const r of match.racers) {
        this.emitter?.toUser(
          r.userId,
          'leaderboard',
          await this.leaderboard(r.userId),
        );
      }
    } catch (error) {
      // The match score still counts; only the lasting record missed this race.
      this.logger.warn(`Recording a 1v1 race failed: ${String(error)}`);
    }
  }

  private findMatch(userId: string): Match | undefined {
    const id = this.matchOf.get(userId);
    return id ? this.matches.get(id) : undefined;
  }

  private racer(match: Match, userId: string): Racer {
    return match.racers[0].userId === userId
      ? match.racers[0]
      : match.racers[1];
  }

  private opponent(match: Match, userId: string): Racer {
    return match.racers[0].userId === userId
      ? match.racers[1]
      : match.racers[0];
  }

  private view(match: Match, userId: string): MatchPush {
    const you = this.racer(match, userId);
    const opponent = this.opponent(match, userId);
    return {
      id: match.id,
      round: match.round,
      phase: match.phase,
      option: match.option,
      config: match.config,
      words: match.words,
      countdownMs:
        match.phase === 'countdown'
          ? Math.max(0, match.countdownEndsAt - Date.now())
          : 0,
      you: { ...you },
      opponent: { ...opponent },
      winner:
        match.winnerId === undefined
          ? null
          : match.winnerId === null
            ? 'draw'
            : match.winnerId === userId
              ? 'you'
              : 'opponent',
      closedReason: match.closedReason,
    };
  }

  private emitMatch(match: Match): void {
    for (const r of match.racers)
      this.emitter?.toUser(r.userId, 'match', this.view(match, r.userId));
  }

  private emitInvite(invite: Invite): void {
    const from = this.members.get(invite.from);
    if (!from?.name) return;
    const push: InvitePush = {
      id: invite.id,
      from: { userId: from.userId, name: from.name },
      expiresInMs: Math.max(0, invite.expiresAt - Date.now()),
    };
    this.emitter?.toUser(invite.to, 'invite', push);
  }

  private closeInvite(invite: Invite, reason: InviteClosedReason): void {
    clearTimeout(invite.timer);
    this.invites.delete(invite.id);
    const push: InviteClosedPush = { id: invite.id, reason };
    this.emitter?.toUser(invite.from, 'invite-closed', push);
    this.emitter?.toUser(invite.to, 'invite-closed', push);
  }

  private broadcastPresence(): void {
    for (const member of this.members.values())
      this.emitter?.toUser(
        member.userId,
        'presence',
        this.players(member.userId),
      );
  }
}
