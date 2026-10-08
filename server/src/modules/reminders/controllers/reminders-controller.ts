import { Body, Controller, Get, HttpCode, Post, Put } from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user-decorator';
import { ZodValidationPipe } from '../../../shared/pipes/zod-validation-pipe';
import type { ReminderSettingsDto } from '../dto/reminders-dto';
import { RemindersService } from '../services/reminders-service';
import { ReminderSettingsSchema } from '../validators/reminders-validator';

// The signed-in user's email reminder to log their hours.
@Controller('v1/reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  // GET /api/v1/reminders → settings, with the stored email
  @Get()
  async get(@CurrentUser() user: string) {
    return await this.remindersService.get(user);
  }

  // PUT /api/v1/reminders { enabled, atMinutes, days } → settings
  @Put()
  async save(
    @CurrentUser() user: string,
    @Body(new ZodValidationPipe(ReminderSettingsSchema))
    body: ReminderSettingsDto,
  ) {
    return await this.remindersService.save(user, body);
  }

  // POST /api/v1/reminders/email → settings; reads the email from N-PAX again
  @Post('email')
  @HttpCode(200)
  async refreshEmail(@CurrentUser() user: string) {
    return await this.remindersService.refreshEmail(user);
  }

  // POST /api/v1/reminders/test → { email }; sends a reminder now
  @Post('test')
  @HttpCode(200)
  async sendTest(@CurrentUser() user: string) {
    return await this.remindersService.sendTest(user);
  }
}
