import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow the Next.js frontend (different origin in dev) to call the API.
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3001',
  });

  // Global validation: strips unknown properties, rejects extras, and
  // converts payloads to their DTO types (e.g. query string -> number).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Consistent JSON error shape across the whole API.
  app.useGlobalFilters(new HttpExceptionFilter());

  // Simple request/response logging for visibility during development.
  app.useGlobalInterceptors(new LoggingInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Perago Information Systems')
    .setDescription(
      'Organizational hierarchy REST API. Positions form a tree via a ' +
        'self-referencing parentId column; subtree and ancestor lookups ' +
        'use recursive CTEs (see PositionsRepository).',
    )
    .setVersion('1.0')
    .addTag('positions')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs at http://localhost:${port}/api`);
}
bootstrap();
