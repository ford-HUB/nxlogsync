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
  AimLabLeaderboardQueryDto,
  AimLabScoreDto,
  AimLabSettingsDto,
} from '../dto/aim-lab-dto';
import { AimLabService } from '../services/aim-lab-service';
import {
  AimLabLeaderboardQuerySchema,
  AimLabScoreSchema,
  AimLabSettingsSchema,
} from '../validators/aim-lab-validator';

// The Aim lab leaderboard and the user's game settings. The player's name is the typing test's (/v1/typing/player).
@Controller('v1/aim-lab')
export class AimLabController {
  constructor(private readonly aimLabService: AimLabService) {}

  // GET /api/v1/aim-lab/leaderboard?setup=dot-gridshot-60 → { setup, entries, you }
  @Get('leaderboard')
  async leaderboard(
    @CurrentUser() user: string,
    @Query(new ZodValidationPipe(AimLabLeaderboardQuerySchema))
    query: AimLabLeaderboardQueryDto,
  ) {
    return await this.aimLabService.leaderboard(user, query.setup);
  }

  // POST /api/v1/aim-lab/scores { setup, score, accuracy, shotsFired, shotsHit } → leaderboard + { personalBest }
  @Post('scores')
  @HttpCode(200)
  async submitScore(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(AimLabScoreSchema)) body: AimLabScoreDto,
  ) {
    return await this.aimLabService.submitScore(user, body);
  }

  // GET /api/v1/aim-lab/settings → { sensitivity } (null until first saved)
  @Get('settings')
  async settings(@CurrentUser() user: string) {
    return await this.aimLabService.settings(user);
  }

  // PUT /api/v1/aim-lab/settings { sensitivity } → { sensitivity }
  @Put('settings')
  async saveSettings(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(AimLabSettingsSchema)) body: AimLabSettingsDto,
  ) {
    return await this.aimLabService.saveSettings(user, body);
  }
}
