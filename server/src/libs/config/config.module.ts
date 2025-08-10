import { Module } from '@nestjs/common';
import { fileLoader, TypedConfigModule } from 'nest-typed-config';
import { join } from 'path';
import { AppConfig } from './app.config';

const defaultConfig = { path: join(__dirname, '../../config') };

export type IConfigModuleOptions = { path?: string };

@Module({})
export class ConfigModule {
  static forRoot(options?: IConfigModuleOptions) {
    const merged = { ...options };
    if (!merged.path) {
      merged.path = defaultConfig.path;
    }

    return {
      module: ConfigModule,
      imports: [
        TypedConfigModule.forRoot({
          schema: AppConfig,
          load: [
            fileLoader({
              searchFrom: merged.path,
              ignoreEnvironmentVariableSubstitution: false,
            }),
          ],
          isGlobal: true,
        }),
      ],
    };
  }
}
