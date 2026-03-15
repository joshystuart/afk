import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ApplicationFactory } from './libs/app-factory/application.factory';
import { AppConfig } from './libs/config/app.config';

export interface BootstrapOptions {
  port?: number;
  configPath?: string;
  staticAssetsPath?: string;
}

export async function bootstrapServer(
  options?: BootstrapOptions,
): Promise<INestApplication> {
  const app = await NestFactory.create(
    AppModule.forRoot({
      configPath: options?.configPath,
      staticAssetsPath: options?.staticAssetsPath,
    }),
  );

  ApplicationFactory.configure(app);

  const config = new DocumentBuilder()
    .setTitle('AFK Server API')
    .setDescription('Remote terminal access service API')
    .setVersion('2.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const appConfig = app.get(AppConfig);
  const port = options?.port ?? appConfig.port;

  await app.listen(port, '0.0.0.0');

  console.log(
    `AFK Server is running on port ${port} in ${appConfig.nodeEnv} mode`,
  );
  console.log(
    `API Documentation available at http://localhost:${port}/api/docs`,
  );

  return app;
}
