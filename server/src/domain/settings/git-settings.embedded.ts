import { Column } from 'typeorm';

export class GitSettings {
  static readonly DEFAULT_GITHUB_CALLBACK_URL =
    'http://localhost:3001/api/github/callback';
  static readonly DEFAULT_GITHUB_FRONTEND_REDIRECT_URL =
    'http://localhost:5173/settings';

  @Column('text', { nullable: true })
  sshPrivateKey?: string;

  @Column('varchar', { length: 255, nullable: true })
  userName?: string;

  @Column('varchar', { length: 255, nullable: true })
  userEmail?: string;

  @Column('text', { nullable: true })
  githubAccessToken?: string | null;

  @Column('varchar', { length: 255, nullable: true })
  githubUsername?: string | null;

  @Column('varchar', { length: 255, nullable: true })
  githubClientId?: string | null;

  @Column('text', { nullable: true })
  githubClientSecret?: string | null;

  @Column('varchar', {
    length: 500,
    nullable: true,
    default: GitSettings.DEFAULT_GITHUB_CALLBACK_URL,
  })
  githubCallbackUrl: string = GitSettings.DEFAULT_GITHUB_CALLBACK_URL;

  @Column('varchar', {
    length: 500,
    nullable: true,
    default: GitSettings.DEFAULT_GITHUB_FRONTEND_REDIRECT_URL,
  })
  githubFrontendRedirectUrl: string =
    GitSettings.DEFAULT_GITHUB_FRONTEND_REDIRECT_URL;

  applyDefaults(): void {
    this.githubCallbackUrl ??= GitSettings.DEFAULT_GITHUB_CALLBACK_URL;
    this.githubFrontendRedirectUrl ??=
      GitSettings.DEFAULT_GITHUB_FRONTEND_REDIRECT_URL;
  }

  updateGitHubToken(token?: string | null, username?: string | null): void {
    this.githubAccessToken = token;
    this.githubUsername = username;
  }
}
