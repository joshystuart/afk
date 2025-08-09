import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApplicationFactory } from './libs/app-factory/application.factory';
import { AppConfig } from './libs/config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure application with global pipes, filters, and interceptors
  ApplicationFactory.configure(app);

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('AFK Server API')
    .setDescription('Remote terminal access service API')
    .setVersion('2.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Get configuration
  const appConfig = app.get(AppConfig);

  await app.listen(appConfig.port);

  console.log(
    `AFK Server is running on port ${appConfig.port} in ${appConfig.nodeEnv} mode`,
  );
  console.log(
    `API Documentation available at http://localhost:${appConfig.port}/api/docs`,
  );
}
bootstrap();
