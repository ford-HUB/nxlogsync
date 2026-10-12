import { Injectable } from '@nestjs/common';
import { RunSettingsDto, RunSettingsResponseDto } from '../dto/settings-dto';
import { RunSettingsRepository } from '../repositories/settings-repository';
import { RunSettingsResponseSchema } from '../validators/settings-validator';

/** The user's Run yourself settings: key bindings per game, checked for conflicts before they're kept. */
@Injectable()
export class RunSettingsService {
  constructor(private readonly repository: RunSettingsRepository) {}

  async settings(userId: string): Promise<RunSettingsResponseDto> {
    const row = await this.repository.findSettings(userId);
    // A row from an older set of controls reads as none, so the desktop falls back to its defaults.
    const parsed = RunSettingsResponseSchema.safeParse({
      keys: row?.keys ?? null,
    });
    return parsed.success ? parsed.data : { keys: null };
  }

  async saveSettings(
    userId: string,
    data: RunSettingsDto,
  ): Promise<RunSettingsResponseDto> {
    await this.repository.saveSettings(userId, data);
    return { keys: data.keys };
  }
}
