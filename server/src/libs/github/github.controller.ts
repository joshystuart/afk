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
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { GitHubService } from './github.service';
import { SettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.tokens';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../response/response.service';
import { Public } from '../auth/auth.guard';
import * as crypto from 'crypto';

@ApiTags('GitHub')
@Controller('github')
export class GitHubController implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(GitHubController.name);
  private static readonly OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
  private static readonly OAUTH_STATE_CLEANUP_INTERVAL_MS = 60 * 1000;
  private readonly oauthStates = new Map<
    string,
    { createdAt: number; source?: string }
  >();
  private oauthStateCleanupTimer?: NodeJS.Timeout;

  constructor(
    private readonly githubService: GitHubService,
    private readonly responseService: ResponseService,
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  onModuleInit(): void {
    this.oauthStateCleanupTimer = setInterval(() => {
      this.cleanupExpiredOauthStates();
    }, GitHubController.OAUTH_STATE_CLEANUP_INTERVAL_MS);

    this.oauthStateCleanupTimer.unref();
  }

  onModuleDestroy(): void {
    if (this.oauthStateCleanupTimer) {
      clearInterval(this.oauthStateCleanupTimer);
      this.oauthStateCleanupTimer = undefined;
    }
  }

  private cleanupExpiredOauthStates(now = Date.now()): void {
    const expiryCutoff = now - GitHubController.OAUTH_STATE_TTL_MS;
    for (const [key, value] of this.oauthStates.entries()) {
      if (value.createdAt < expiryCutoff) {
        this.oauthStates.delete(key);
      }
    }
  }

  private isStateExpired(createdAt: number, now = Date.now()): boolean {
    return now - createdAt > GitHubController.OAUTH_STATE_TTL_MS;
  }

  private async resolveOAuthConfig(): Promise<{
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    frontendRedirectUrl: string;
  }> {
    const settings = await this.settingsRepository.get();
    return {
      clientId: settings.git.githubClientId || '',
      clientSecret: settings.git.githubClientSecret || '',
      callbackUrl: settings.git.githubCallbackUrl,
      frontendRedirectUrl: settings.git.githubFrontendRedirectUrl,
    };
  }

  @Public()
  @Get('auth')
  @ApiOperation({ summary: 'Start GitHub OAuth flow' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth' })
  async auth(
    @Query('source') source: string | undefined,
    @Res() res: Response,
  ): Promise<void> {
    const oauth = await this.resolveOAuthConfig();

    if (!oauth.clientId || !oauth.clientSecret) {
      throw new HttpException(
        'GitHub OAuth is not configured. Set GitHub Client ID and Client Secret in Settings.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const state = crypto.randomBytes(16).toString('hex');
    this.oauthStates.set(state, { createdAt: Date.now(), source });
    this.cleanupExpiredOauthStates();

    const authUrl = this.githubService.getAuthUrl(
      oauth.clientId,
      oauth.callbackUrl,
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
    const oauth = await this.resolveOAuthConfig();
    const redirectUrl = oauth.frontendRedirectUrl;

    const storedState = this.oauthStates.get(state);
    if (!storedState) {
      this.logger.warn('Invalid OAuth state received');
      res.redirect(`${redirectUrl}?github=error&reason=invalid_state`);
      return;
    }

    const isElectron = storedState.source === 'electron';

    if (this.isStateExpired(storedState.createdAt)) {
      this.oauthStates.delete(state);
      this.logger.warn('Expired OAuth state received');
      if (isElectron) {
        this.sendElectronHtml(res, false, 'OAuth state has expired.');
      } else {
        res.redirect(`${redirectUrl}?github=error&reason=invalid_state`);
      }
      return;
    }
    this.oauthStates.delete(state);

    try {
      const token = await this.githubService.exchangeCodeForToken(
        oauth.clientId,
        oauth.clientSecret,
        code,
      );

      const user = await this.githubService.getUser(token);

      const settings = await this.settingsRepository.get();
      settings.git.updateGitHubToken(token, user.login);
      await this.settingsRepository.save(settings);

      this.logger.log(`GitHub connected for user: ${user.login}`);

      if (isElectron) {
        this.sendElectronHtml(
          res,
          true,
          `Connected as ${user.login}. You can close this tab.`,
        );
      } else {
        res.redirect(`${redirectUrl}?github=connected`);
      }
    } catch (error) {
      this.logger.error('GitHub OAuth callback failed', error);
      if (isElectron) {
        this.sendElectronHtml(res, false, 'Failed to connect GitHub account.');
      } else {
        res.redirect(
          `${redirectUrl}?github=error&reason=token_exchange_failed`,
        );
      }
    }
  }

  private sendElectronHtml(
    res: Response,
    success: boolean,
    message: string,
  ): void {
    const color = success ? '#22c55e' : '#ef4444';
    const title = success ? 'GitHub Connected' : 'GitHub Connection Failed';
    res.type('html').send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0a0a0a;color:#e5e5e5}
.card{text-align:center;padding:2rem}.icon{font-size:3rem;margin-bottom:1rem}
h1{font-size:1.25rem;margin:0 0 .5rem;color:${color}}p{margin:0;color:#a3a3a3;font-size:.875rem}</style></head>
<body><div class="card"><div class="icon">${success ? '&#10003;' : '&#10007;'}</div>
<h1>${title}</h1><p>${message}</p></div></body></html>`);
  }

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
        'GitHub is not connected. Connect GitHub in Settings first.',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const repos = await this.githubService.listRepos(
        settings.git.githubAccessToken!,
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
