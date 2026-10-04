import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
} from '@nestjs/common';
import { CredentialsService } from '../services/credentials-service';

type LoginBody = { userId?: unknown; password?: unknown };

function parseLogin(body: LoginBody | undefined): {
  userId: string;
  password: string;
} {
  const { userId, password } = body ?? {};
  if (typeof userId !== 'string' || userId.trim() === '') {
    throw new BadRequestException('userId is required');
  }
  if (typeof password !== 'string' || password === '') {
    throw new BadRequestException('password is required');
  }
  return { userId: userId.trim(), password };
}

@Controller('v1/credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  // POST /api/v1/credentials/verify  { userId, password } → { valid }
  @Post('verify')
  @HttpCode(200)
  async verify(@Body() body: LoginBody) {
    const { userId, password } = parseLogin(body);
    return await this.credentialsService.verify(userId, password);
  }

  // POST /api/v1/credentials/connect  { userId, password } → { valid, session }
  @Post('connect')
  @HttpCode(200)
  async connect(@Body() body: LoginBody) {
    const { userId, password } = parseLogin(body);
    return await this.credentialsService.connect(userId, password);
  }

  // POST /api/v1/credentials/disconnect → session
  @Post('disconnect')
  @HttpCode(200)
  async disconnect() {
    return await this.credentialsService.disconnect();
  }

  // GET /api/v1/credentials/status → session
  @Get('status')
  status() {
    return this.credentialsService.status();
  }

  // POST /api/v1/credentials/check → session (keep-alive run on demand)
  @Post('check')
  @HttpCode(200)
  async check() {
    return await this.credentialsService.check();
  }
}
