import {
  Controller,
  Get,
  Delete,
  Query,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GitHubService } from './github.service';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../response/response.service';

@ApiTags('GitHub')
@Controller('github')
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);

  constructor(
    private readonly githubService: GitHubService,
    private readonly responseService: ResponseService,
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Check GitHub connection status' })
  @ApiResponse({ status: 200, description: 'GitHub connection status' })
  async status(): Promise<
    ApiResponseType<{ connected: boolean; username?: string }>
  > {
    const settings = await this.settingsRepository.get();

    return this.responseService.success({
      connected: !!settings.git.githubAccessToken,
      username: settings.git.githubUsername ?? undefined,
    });
  }

  @Get('repos')
  @ApiOperation({ summary: 'List GitHub repositories' })
  @ApiResponse({ status: 200, description: 'List of repositories' })
  async repos(
    @Query('search') search?: string,
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ): Promise<ApiResponseType<any>> {
    const settings = await this.settingsRepository.get();

    if (!settings.git.githubAccessToken) {
      throw new HttpException(
        'GitHub is not connected. Add a GitHub Personal Access Token in Settings first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const repos = await this.githubService.listRepos(
        settings.git.githubAccessToken,
        {
          search,
          sort: sort || 'pushed',
          page: page ? parseInt(page, 10) : 1,
          perPage: perPage ? parseInt(perPage, 10) : 30,
        },
      );

      return this.responseService.success(repos);
    } catch (error) {
      this.logger.error('Failed to list GitHub repos', error);
      throw new HttpException(
        'Failed to fetch repositories from GitHub',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Delete('disconnect')
  @ApiOperation({ summary: 'Disconnect GitHub' })
  @ApiResponse({ status: 200, description: 'GitHub disconnected' })
  async disconnect(): Promise<ApiResponseType<{ disconnected: boolean }>> {
    const settings = await this.settingsRepository.get();
    settings.git.updateGitHubToken(null, null);
    await this.settingsRepository.save(settings);

    this.logger.log('GitHub disconnected');

    return this.responseService.success({ disconnected: true });
  }
}
