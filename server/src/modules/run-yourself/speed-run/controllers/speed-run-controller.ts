import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { CurrentUser } from '../../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation-pipe';
import type { SpeedRunScoreDto } from '../dto/speed-run-dto';
import { SpeedRunService } from '../services/speed-run-service';
import { SpeedRunScoreSchema } from '../validators/speed-run-validator';

// Run yourself's Speed run leaderboard. The player's name is the typing test's.
@Controller('v1/run-yourself/speed-run')
export class SpeedRunController {
  constructor(private readonly speedRunService: SpeedRunService) {}

  // GET /api/v1/run-yourself/speed-run/leaderboard → { entries, you }
  @Get('leaderboard')
  async leaderboard(@CurrentUser() user: string) {
    return await this.speedRunService.leaderboard(user);
  }

  // POST /api/v1/run-yourself/speed-run/scores { points, seconds } → leaderboard + { personalBest }
  @Post('scores')
  @HttpCode(200)
  async submitScore(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(SpeedRunScoreSchema)) body: SpeedRunScoreDto,
  ) {
    return await this.speedRunService.submitScore(user, body);
  }
}
