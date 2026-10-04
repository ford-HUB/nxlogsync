import { Injectable } from '@nestjs/common';
import { NpaxCredential } from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';

/** One saved N-PAX login per user, keyed by the user's key (see toUserKey). */
@Injectable()
export class CredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(userId: string): Promise<NpaxCredential | null> {
    return this.prisma.npaxCredential.findUnique({ where: { userId } });
  }

  findAll(): Promise<NpaxCredential[]> {
    return this.prisma.npaxCredential.findMany();
  }

  save(
    userId: string,
    loginId: string,
    passwordEncrypted: string,
  ): Promise<NpaxCredential> {
    return this.prisma.npaxCredential.upsert({
      where: { userId },
      create: { userId, loginId, passwordEncrypted },
      update: { loginId, passwordEncrypted },
    });
  }

  async delete(userId: string): Promise<void> {
    await this.prisma.npaxCredential.deleteMany({ where: { userId } });
  }
}
