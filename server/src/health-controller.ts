import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from './shared/decorators/public-decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Get()
  @Public()
  check(): { status: string; environment: string } {
    return {
      status: 'ok',
      environment: this.config.get<string>('NODE_ENV', 'development'),
    };
  }
}
