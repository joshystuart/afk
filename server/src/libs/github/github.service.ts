import { Injectable, Logger } from '@nestjs/common';

export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  language: string | null;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubRepoListParams {
  search?: string;
  sort?: string;
  page?: number;
  perPage?: number;
}

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

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
    const response = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(
        `GitHub OAuth error: ${data.error_description || data.error}`,
      );
    }

    return data.access_token;
  }

  async getUser(token: string): Promise<GitHubUser> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'AFK-App',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  async listRepos(
    token: string,
    params: GitHubRepoListParams = {},
  ): Promise<GitHubRepo[]> {
    const { search, sort = 'pushed', page = 1, perPage = 30 } = params;

    // If there's a search term, use the search API
    if (search && search.trim()) {
      return this.searchRepos(token, search, page, perPage);
    }

    // Otherwise, list user repos
    const queryParams = new URLSearchParams({
      sort,
      direction: 'desc',
      per_page: perPage.toString(),
      page: page.toString(),
      type: 'all',
    });

    const response = await fetch(
      `https://api.github.com/user/repos?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AFK-App',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    return response.json();
  }

  private async searchRepos(
    token: string,
    search: string,
    page: number,
    perPage: number,
  ): Promise<GitHubRepo[]> {
    // Search repos the user has access to
    const queryParams = new URLSearchParams({
      q: `${search} in:name fork:true`,
      sort: 'updated',
      order: 'desc',
      per_page: perPage.toString(),
      page: page.toString(),
    });

    const response = await fetch(
      `https://api.github.com/search/repositories?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'AFK-App',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }
}
