import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  check(): { status: string; environment: string } {
    return {
      status: 'ok',
      environment: this.config.get<string>('NODE_ENV', 'development'),
    };
  }
}
