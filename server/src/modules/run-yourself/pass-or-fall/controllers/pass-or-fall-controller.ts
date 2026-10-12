import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation-pipe';
import type {
  PassOrFallProgressDto,
  PassOrFallScoreDto,
} from '../dto/pass-or-fall-dto';
import { PassOrFallService } from '../services/pass-or-fall-service';
import {
  PassOrFallProgressSchema,
  PassOrFallScoreSchema,
} from '../validators/pass-or-fall-validator';

// Run yourself's Pass or fall: Continue's saved progress and the leaderboard. The player's name is the typing test's.
@Controller('v1/run-yourself/pass-or-fall')
export class PassOrFallController {
  constructor(private readonly passOrFallService: PassOrFallService) {}

  // GET /api/v1/run-yourself/pass-or-fall/progress → { progress: { level, points, seconds } | null }
  @Get('progress')
  async progress(@CurrentUser() user: string) {
    return await this.passOrFallService.progress(user);
  }

  // PUT /api/v1/run-yourself/pass-or-fall/progress { level, points, seconds } → { progress } (never moves back)
  @Put('progress')
  async saveProgress(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(PassOrFallProgressSchema))
    body: PassOrFallProgressDto,
  ) {
    return await this.passOrFallService.saveProgress(user, body);
  }

  // GET /api/v1/run-yourself/pass-or-fall/leaderboard → { entries, you }
  @Get('leaderboard')
  async leaderboard(@CurrentUser() user: string) {
    return await this.passOrFallService.leaderboard(user);
  }

  // POST /api/v1/run-yourself/pass-or-fall/scores { points, levels, seconds } → leaderboard + { personalBest }
  @Post('scores')
  @HttpCode(200)
  async submitScore(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(PassOrFallScoreSchema))
    body: PassOrFallScoreDto,
  ) {
    return await this.passOrFallService.submitScore(user, body);
  }
}
