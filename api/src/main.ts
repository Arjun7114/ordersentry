import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enforces DTO validation rules on every incoming request.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip any fields not declared in the DTO
      forbidNonWhitelisted: true, // reject requests that send unknown fields
      transform: true, // auto-convert payloads to DTO types
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();