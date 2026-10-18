import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type {
  LeaderboardQueryDto,
  NameAvailabilityQueryDto,
  TypingPlayerDto,
  TypingScoreDto,
} from '../dto/typing-dto';
import { TypingDuelService } from '../services/typing-duel-service';
import { TypingService } from '../services/typing-service';
import {
  LeaderboardQuerySchema,
  NameAvailabilityQuerySchema,
  TypingPlayerSchema,
  TypingScoreSchema,
} from '../validators/typing-validator';

// The typing test's leaderboard: the signed-in user's name and best runs.
@Controller('v1/typing')
export class TypingController {
  constructor(
    private readonly typingService: TypingService,
    private readonly duelService: TypingDuelService,
  ) {}

  // GET /api/v1/typing/player → { name }; null until picked
  @Get('player')
  async getPlayer(@CurrentUser() user: string) {
    return await this.typingService.getPlayer(user);
  }

  // PUT /api/v1/typing/player { name } → { name }; 409 when another player has it
  @Put('player')
  async savePlayer(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(TypingPlayerSchema)) body: TypingPlayerDto,
  ) {
    return await this.typingService.savePlayer(user, body.name);
  }

  // GET /api/v1/typing/player/name-available?name=kai → { available }; the caller's own name is available
  @Get('player/name-available')
  async nameAvailable(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(NameAvailabilityQuerySchema))
    query: NameAvailabilityQueryDto,
  ) {
    return await this.typingService.nameAvailable(user, query.name);
  }

  // GET /api/v1/typing/leaderboard?setup=time-30 → { setup, entries, you }
  @Get('leaderboard')
  async leaderboard(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(LeaderboardQuerySchema))
    query: LeaderboardQueryDto,
  ) {
    return await this.typingService.leaderboard(user, query.setup);
  }

  // GET /api/v1/typing/duel/leaderboard → { entries, you }; most 1v1 races won
  @Get('duel/leaderboard')
  async duelLeaderboard(@CurrentUser() user: string) {
    return await this.duelService.leaderboard(user);
  }

  // POST /api/v1/typing/scores { setup, wpm, accuracy } → leaderboard + { personalBest }
  @Post('scores')
  @HttpCode(200)
  async submitScore(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(TypingScoreSchema)) body: TypingScoreDto,
  ) {
    return await this.typingService.submitScore(user, body);
  }
}
