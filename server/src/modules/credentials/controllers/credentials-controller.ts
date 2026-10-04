import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../../../shared/decorators/current-user-decorator';
import { Public } from '../../../shared/decorators/public-decorator';
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
  @Public()
  @HttpCode(200)
  async verify(@Body() body: LoginBody) {
    const { userId, password } = parseLogin(body);
    return await this.credentialsService.verify(userId, password);
  }

  // POST /api/v1/credentials/connect  { userId, password } → { valid, session, token }
  // `token` (null when invalid) is the Bearer token for every other request.
  @Post('connect')
  @Public()
  @HttpCode(200)
  async connect(@Body() body: LoginBody) {
    const { userId, password } = parseLogin(body);
    return await this.credentialsService.connect(userId, password);
  }

  // POST /api/v1/credentials/disconnect → session (signs out this user's desktops)
  @Post('disconnect')
  @HttpCode(200)
  async disconnect(@CurrentUser() user: string) {
    return await this.credentialsService.disconnect(user);
  }

  // GET /api/v1/credentials/status → the caller's session ('disconnected' without a valid token)
  @Get('status')
  @Public()
  status(@CurrentUser() user: string | null) {
    return this.credentialsService.status(user);
  }

  // POST /api/v1/credentials/check → session (keep-alive run on demand)
  @Post('check')
  @HttpCode(200)
  async check(@CurrentUser() user: string) {
    return await this.credentialsService.check(user);
  }
}
