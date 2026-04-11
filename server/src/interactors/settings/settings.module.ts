import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { GetSettingsInteractor } from './get-settings/get-settings.interactor';
import { UpdateSettingsInteractor } from './update-settings/update-settings.interactor';
import { ResponseModule } from '../../libs/response/response.module';
import { SettingsPersistenceModule } from '../../libs/settings/settings-persistence.module';
import { GitHubModule } from '../../libs/github/github.module';
import { MountPathValidator } from '../../libs/validators/mount-path.validator';

@Module({
  imports: [ResponseModule, SettingsPersistenceModule, GitHubModule],
  controllers: [SettingsController],
  providers: [
    GetSettingsInteractor,
    UpdateSettingsInteractor,
    MountPathValidator,
  ],
})
export class SettingsModule {}
