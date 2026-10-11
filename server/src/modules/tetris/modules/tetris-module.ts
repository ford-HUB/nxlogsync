import { Module } from '@nestjs/common';
import { CredentialsModule } from '../../credentials/modules/credentials-module';
import { TetrisController } from '../controllers/tetris-controller';
import { TetrisGateway } from '../controllers/tetris-gateway';
import { TetrisRepository } from '../repositories/tetris-repository';
import { TetrisService } from '../services/tetris-service';

@Module({
  imports: [CredentialsModule],
  controllers: [TetrisController],
  providers: [TetrisService, TetrisRepository, TetrisGateway],
})
export class TetrisModule {}
