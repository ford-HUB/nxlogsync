import { Injectable } from '@nestjs/common';
import { NpaxCredential } from '../../../infrastructures/prisma/common/client';
import { PrismaService } from '../../../infrastructures/prisma/prisma-service';

// One saved login: whoever connected last.
const CREDENTIAL_ID = 1;

@Injectable()
export class CredentialsRepository {
  constructor(private readonly prisma: PrismaService) {}

  find(): Promise<NpaxCredential | null> {
    return this.prisma.npaxCredential.findUnique({
      where: { id: CREDENTIAL_ID },
    });
  }

  save(userId: string, passwordEncrypted: string): Promise<NpaxCredential> {
    return this.prisma.npaxCredential.upsert({
      where: { id: CREDENTIAL_ID },
      create: { id: CREDENTIAL_ID, userId, passwordEncrypted },
      update: { userId, passwordEncrypted },
    });
  }

  async delete(): Promise<void> {
    await this.prisma.npaxCredential.deleteMany({
      where: { id: CREDENTIAL_ID },
    });
  }
}
