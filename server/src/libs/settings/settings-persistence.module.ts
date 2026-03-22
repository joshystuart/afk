import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from '../../domain/settings/settings.entity';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';
import { SettingsRepositoryImpl } from '../../services/repositories/settings.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Settings])],
  providers: [
    SettingsRepositoryImpl,
    {
      provide: SETTINGS_REPOSITORY,
      useExisting: SettingsRepositoryImpl,
    },
  ],
  exports: [SETTINGS_REPOSITORY],
})
export class SettingsPersistenceModule {}
