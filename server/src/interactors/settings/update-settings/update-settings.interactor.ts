import { Injectable, Inject } from '@nestjs/common';
import { SettingsRepository } from '../../../domain/settings/settings.repository';
import { Settings } from '../../../domain/settings/settings.entity';
import { UpdateSettingsRequest } from './update-settings-request.dto';
import { SETTINGS_REPOSITORY } from '../../../domain/settings/settings.tokens';

@Injectable()
export class UpdateSettingsInteractor {
  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async execute(request: UpdateSettingsRequest): Promise<Settings> {
    const currentSettings = await this.settingsRepository.get();

    currentSettings.update({
      sshPrivateKey: request.sshPrivateKey,
      claudeToken: request.claudeToken,
      gitUserName: request.gitUserName,
      gitUserEmail: request.gitUserEmail,
    });

    return await this.settingsRepository.save(currentSettings);
  }
}
