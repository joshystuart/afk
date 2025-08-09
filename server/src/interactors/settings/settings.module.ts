import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { GetSettingsInteractor } from './get-settings/get-settings.interactor';
import { UpdateSettingsInteractor } from './update-settings/update-settings.interactor';
import { SettingsRepositoryImpl } from '../../services/repositories/settings.repository';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { ResponseService } from '../../libs/response/response.service';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';

@Module({
  controllers: [SettingsController],
  providers: [
    GetSettingsInteractor,
    UpdateSettingsInteractor,
    ResponseService,
    {
      provide: SETTINGS_REPOSITORY,
      useClass: SettingsRepositoryImpl,
    },
  ],
  exports: [SETTINGS_REPOSITORY],
})
export class SettingsModule {}