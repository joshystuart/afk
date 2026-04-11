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
import { MountPathValidator } from '../../../libs/validators/mount-path.validator';
import { MountPathValidationError } from '../../../libs/validators/mount-path-validation.error';

@Injectable()
export class UpdateSettingsInteractor {
  private readonly logger = new Logger(UpdateSettingsInteractor.name);

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
    private readonly githubService: GitHubService,
    private readonly mountPathValidator: MountPathValidator,
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

    if (request.skillsDirectory) {
      try {
        this.mountPathValidator.validate(request.skillsDirectory);
      } catch (error) {
        if (error instanceof MountPathValidationError) {
          throw new BadRequestException(error.message);
        }
        throw error;
      }
    }

    try {
      currentSettings.update({
        sshPrivateKey: request.sshPrivateKey,
        claudeToken: request.claudeToken,
        gitUserName: request.gitUserName,
        gitUserEmail: request.gitUserEmail,
        defaultMountDirectory: request.defaultMountDirectory,
        skillsDirectory: request.skillsDirectory,
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
