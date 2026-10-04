import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app-module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.enableShutdownHooks();
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  Logger.log(
    `Listening on port ${port} (NODE_ENV=${process.env.NODE_ENV ?? 'development'})`,
    'Bootstrap',
  );
}
void bootstrap();
