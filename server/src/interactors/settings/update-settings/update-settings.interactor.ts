import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { SettingsRepository } from '../../../domain/settings/settings.repository';
import {
  Settings,
  SettingsValidationError,
} from '../../../domain/settings/settings.entity';
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

    try {
      currentSettings.update({
        sshPrivateKey: request.sshPrivateKey,
        claudeToken: request.claudeToken,
        gitUserName: request.gitUserName,
        gitUserEmail: request.gitUserEmail,
        defaultMountDirectory: request.defaultMountDirectory,
        dockerSocketPath: request.dockerSocketPath,
        dockerStartPort: request.dockerStartPort,
        dockerEndPort: request.dockerEndPort,
        githubClientId: request.githubClientId,
        githubClientSecret: request.githubClientSecret,
        githubCallbackUrl: request.githubCallbackUrl,
        githubFrontendRedirectUrl: request.githubFrontendRedirectUrl,
        idleCleanupEnabled: request.idleCleanupEnabled,
        idleTimeoutMinutes: request.idleTimeoutMinutes,
      });
    } catch (error) {
      if (error instanceof SettingsValidationError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    return await this.settingsRepository.save(currentSettings);
  }
}
