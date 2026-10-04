import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';

@Injectable()
export class UserSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserId(tokenHash: string): Promise<string | null> {
    const session = await this.prisma.userSession.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });
    return session?.userId ?? null;
  }

  async create(tokenHash: string, userId: string): Promise<void> {
    await this.prisma.userSession.create({ data: { tokenHash, userId } });
  }

  async deleteForUser(userId: string): Promise<void> {
    await this.prisma.userSession.deleteMany({ where: { userId } });
  }
}
