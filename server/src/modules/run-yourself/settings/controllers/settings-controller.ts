import { Body, Controller, Get, Put } from '@nestjs/common';
import { CurrentUser } from '../../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../../shared/pipes/zod-validation-pipe';
import type { RunSettingsDto } from '../dto/settings-dto';
import { RunSettingsService } from '../services/settings-service';
import { RunSettingsSchema } from '../validators/settings-validator';

// The user's Run yourself settings.
@Controller('v1/run-yourself')
export class RunSettingsController {
  constructor(private readonly runSettingsService: RunSettingsService) {}

  // GET /api/v1/run-yourself/settings → { keys } (null until first saved)
  @Get('settings')
  async settings(@CurrentUser() user: string) {
    return await this.runSettingsService.settings(user);
  }

  // PUT /api/v1/run-yourself/settings { keys } → { keys }; a key doing two things in one game is a 400
  @Put('settings')
  async saveSettings(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(RunSettingsSchema)) body: RunSettingsDto,
  ) {
    return await this.runSettingsService.saveSettings(user, body);
  }
}
