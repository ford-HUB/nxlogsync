import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type {
  TetrisLeaderboardQueryDto,
  TetrisScoreDto,
} from '../dto/tetris-dto';
import { TetrisService } from '../services/tetris-service';
import {
  TetrisLeaderboardQuerySchema,
  TetrisScoreSchema,
} from '../validators/tetris-validator';

// The Tetris leaderboard. The player's name is the typing test's (/v1/typing/player).
@Controller('v1/tetris')
export class TetrisController {
  constructor(private readonly tetrisService: TetrisService) {}

  // GET /api/v1/tetris/leaderboard?setup=level-15 → { setup, entries, you }
  @Get('leaderboard')
  async leaderboard(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(TetrisLeaderboardQuerySchema))
    query: TetrisLeaderboardQueryDto,
  ) {
    return await this.tetrisService.leaderboard(user, query.setup);
  }

  // POST /api/v1/tetris/scores { setup, score, lines, level } → leaderboard + { personalBest }
  @Post('scores')
  @HttpCode(200)
  async submitScore(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(TetrisScoreSchema)) body: TetrisScoreDto,
  ) {
    return await this.tetrisService.submitScore(user, body);
  }
}
