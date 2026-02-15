import {
  Controller,
  Get,
  Delete,
  Query,
  Res,
  Inject,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { GitHubService } from './github.service';
import { GitHubConfig } from './github.config';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../response/response.service';
import { Public } from '../../auth/auth.guard';
import * as crypto from 'crypto';

@ApiTags('GitHub')
@Controller('github')
export class GitHubController {
  private readonly logger = new Logger(GitHubController.name);
  private readonly oauthStates = new Map<string, { createdAt: number }>();

  constructor(
    private readonly githubService: GitHubService,
    private readonly githubConfig: GitHubConfig,
    private readonly responseService: ResponseService,
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  @Public()
  @Get('auth')
  @ApiOperation({ summary: 'Start GitHub OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth' })
  async auth(@Res() res: Response): Promise<void> {
    if (!this.githubConfig.clientId || !this.githubConfig.clientSecret) {
      throw new HttpException(
        'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const state = crypto.randomBytes(16).toString('hex');
    this.oauthStates.set(state, { createdAt: Date.now() });

    // Clean up old states (older than 10 min)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of this.oauthStates.entries()) {
      if (value.createdAt < tenMinutesAgo) {
        this.oauthStates.delete(key);
      }
    }

    const authUrl = this.githubService.getAuthUrl(
      this.githubConfig.clientId,
      this.githubConfig.callbackUrl,
      state,
    );

    res.redirect(authUrl);
  }

  @Public()
  @Get('callback')
  @ApiOperation({ summary: 'GitHub OAuth callback' })
  @ApiResponse({ status: 302, description: 'Redirects to frontend' })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ): Promise<void> {
    const redirectUrl = this.githubConfig.frontendRedirectUrl;

    // Validate state
    const storedState = this.oauthStates.get(state);
    if (!storedState) {
      this.logger.warn('Invalid OAuth state received');
      res.redirect(`${redirectUrl}?github=error&reason=invalid_state`);
      return;
    }
    this.oauthStates.delete(state);

    try {
      // Exchange code for token
      const token = await this.githubService.exchangeCodeForToken(
        this.githubConfig.clientId,
        this.githubConfig.clientSecret,
        code,
      );

      // Get GitHub user info
      const user = await this.githubService.getUser(token);

      // Save to settings
      const settings = await this.settingsRepository.get();
      settings.updateGitHubToken(token, user.login);
      await this.settingsRepository.save(settings);

      this.logger.log(`GitHub connected for user: ${user.login}`);

      res.redirect(`${redirectUrl}?github=connected`);
    } catch (error) {
      this.logger.error('GitHub OAuth callback failed', error);
      res.redirect(`${redirectUrl}?github=error&reason=token_exchange_failed`);
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Check GitHub connection status' })
  @ApiResponse({ status: 200, description: 'GitHub connection status' })
  async status(): Promise<
    ApiResponseType<{ connected: boolean; username?: string }>
  > {
    const settings = await this.settingsRepository.get();

    return this.responseService.success({
      connected: !!settings.githubAccessToken,
      username: settings.githubUsername,
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

    if (!settings.githubAccessToken) {
      throw new HttpException(
        'GitHub is not connected. Connect GitHub in Settings first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const repos = await this.githubService.listRepos(
        settings.githubAccessToken,
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
    settings.updateGitHubToken(undefined, undefined);
    await this.settingsRepository.save(settings);

    this.logger.log('GitHub disconnected');

    return this.responseService.success({ disconnected: true });
  }
}
