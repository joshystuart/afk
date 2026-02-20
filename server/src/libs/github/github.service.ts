import { Injectable, Logger } from '@nestjs/common';
import { Octokit } from '@octokit/rest';
import { exchangeWebFlowCode } from '@octokit/oauth-methods';
import type { GetResponseDataTypeFromEndpointMethod } from '@octokit/types';

const octokit = new Octokit();

export type GitHubUser = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.users.getAuthenticated
>;

export type GitHubRepo = GetResponseDataTypeFromEndpointMethod<
  typeof octokit.repos.listForAuthenticatedUser
>[number];

export interface GitHubRepoListParams {
  search?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  private createOctokit(token: string): Octokit {
    return new Octokit({
      auth: token,
      userAgent: 'AFK-App',
    });
  }

  getAuthUrl(clientId: string, callbackUrl: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: 'repo',
      state,
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(
    clientId: string,
    clientSecret: string,
    code: string,
  ): Promise<string> {
    const { authentication } = await exchangeWebFlowCode({
      clientType: 'oauth-app',
      clientId,
      clientSecret,
      code,
    });

    return authentication.token;
  }

  async getUser(token: string): Promise<GitHubUser> {
    const octokit = this.createOctokit(token);
    const { data } = await octokit.users.getAuthenticated();
    return data;
  }

  async listRepos(
    token: string,
    params: GitHubRepoListParams = {},
  ): Promise<GitHubRepo[]> {
    const { search, sort = 'pushed', page = 1, perPage = 30 } = params;

    if (search && search.trim()) {
      return this.searchRepos(token, search, page, perPage);
    }

    const octokit = this.createOctokit(token);
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: sort as 'pushed' | 'updated' | 'full_name' | 'created',
      direction: 'desc',
      per_page: perPage,
      page,
      type: 'all',
    });

    return data;
  }

  private async searchRepos(
    token: string,
    search: string,
    page: number,
    perPage: number,
  ): Promise<GitHubRepo[]> {
    const octokit = this.createOctokit(token);
    const { data } = await octokit.search.repos({
      q: `${search} in:name fork:true`,
      sort: 'updated',
      order: 'desc',
      per_page: perPage,
      page,
    });

    return data.items as GitHubRepo[];
  }
}
