import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SettingsRepository } from '../../../domain/settings/settings.repository';
import {
  Settings,
  SettingsValidationError,
} from '../../../domain/settings/settings.entity';
import { UpdateSettingsRequest } from './update-settings-request.dto';
import { SETTINGS_REPOSITORY } from '../../../domain/settings/settings.tokens';
import { GitHubService } from '../../../libs/github/github.service';

@Injectable()
export class UpdateSettingsInteractor {
  private readonly logger = new Logger(UpdateSettingsInteractor.name);

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
    private readonly githubService: GitHubService,
  ) {}

  async execute(request: UpdateSettingsRequest): Promise<Settings> {
    const currentSettings = await this.settingsRepository.get();

    // If a new GitHub token is being set, resolve the username
    if (request.githubAccessToken) {
      try {
        const user = await this.githubService.getUser(
          request.githubAccessToken,
        );
        currentSettings.git.githubUsername = user.login;
        this.logger.log(`GitHub token validated for user: ${user.login}`);
      } catch (error) {
        throw new BadRequestException(
          'Invalid GitHub Personal Access Token. Please check the token and try again.',
        );
      }
    }

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
        githubAccessToken: request.githubAccessToken,
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
