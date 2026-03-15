import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Settings {
  static readonly DEFAULT_DOCKER_SOCKET_PATH = '/var/run/docker.sock';
  static readonly DEFAULT_DOCKER_START_PORT = 7681;
  static readonly DEFAULT_DOCKER_END_PORT = 7780;
  static readonly DEFAULT_GITHUB_CALLBACK_URL =
    'http://localhost:3001/api/github/callback';
  static readonly DEFAULT_GITHUB_FRONTEND_REDIRECT_URL =
    'http://localhost:5173/settings';

  @PrimaryColumn('varchar', { length: 10, default: 'default' })
  id: string = 'default';

  @Column('text', { nullable: true })
  sshPrivateKey?: string;

  @Column('varchar', { length: 255, nullable: true })
  claudeToken?: string;

  @Column('varchar', { length: 255, nullable: true })
  gitUserName?: string;

  @Column('varchar', { length: 255, nullable: true })
  gitUserEmail?: string;

  @Column('text', { nullable: true })
  githubAccessToken?: string | null;

  @Column('varchar', { length: 255, nullable: true })
  githubUsername?: string | null;

  @Column('varchar', { length: 500, nullable: true })
  defaultMountDirectory?: string | null;

  @Column('varchar', {
    length: 500,
    nullable: true,
    default: Settings.DEFAULT_DOCKER_SOCKET_PATH,
  })
  dockerSocketPath: string = Settings.DEFAULT_DOCKER_SOCKET_PATH;

  @Column('int', {
    nullable: true,
    default: Settings.DEFAULT_DOCKER_START_PORT,
  })
  dockerStartPort: number = Settings.DEFAULT_DOCKER_START_PORT;

  @Column('int', { nullable: true, default: Settings.DEFAULT_DOCKER_END_PORT })
  dockerEndPort: number = Settings.DEFAULT_DOCKER_END_PORT;

  @Column('varchar', { length: 255, nullable: true })
  githubClientId?: string | null;

  @Column('text', { nullable: true })
  githubClientSecret?: string | null;

  @Column('varchar', {
    length: 500,
    nullable: true,
    default: Settings.DEFAULT_GITHUB_CALLBACK_URL,
  })
  githubCallbackUrl: string = Settings.DEFAULT_GITHUB_CALLBACK_URL;

  @Column('varchar', {
    length: 500,
    nullable: true,
    default: Settings.DEFAULT_GITHUB_FRONTEND_REDIRECT_URL,
  })
  githubFrontendRedirectUrl: string =
    Settings.DEFAULT_GITHUB_FRONTEND_REDIRECT_URL;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    sshPrivateKey?: string,
    claudeToken?: string,
    gitUserName?: string,
    gitUserEmail?: string,
    updatedAt?: Date,
  ) {
    this.sshPrivateKey = sshPrivateKey;
    this.claudeToken = claudeToken;
    this.gitUserName = gitUserName;
    this.gitUserEmail = gitUserEmail;
    if (updatedAt) {
      this.updatedAt = updatedAt;
    }
  }

  /**
   * Fills in default values for any null fields that have known defaults.
   * Handles existing DB records that were created before defaults were added.
   */
  applyDefaults(): this {
    this.dockerSocketPath ??= Settings.DEFAULT_DOCKER_SOCKET_PATH;
    this.dockerStartPort ??= Settings.DEFAULT_DOCKER_START_PORT;
    this.dockerEndPort ??= Settings.DEFAULT_DOCKER_END_PORT;
    this.githubCallbackUrl ??= Settings.DEFAULT_GITHUB_CALLBACK_URL;
    this.githubFrontendRedirectUrl ??=
      Settings.DEFAULT_GITHUB_FRONTEND_REDIRECT_URL;
    return this;
  }

  updateSshPrivateKey(sshPrivateKey: string | undefined): void {
    this.sshPrivateKey = sshPrivateKey;
    this.updatedAt = new Date();
  }

  updateClaudeToken(claudeToken: string | undefined): void {
    this.claudeToken = claudeToken;
    this.updatedAt = new Date();
  }

  updateGitConfig(userName?: string, userEmail?: string): void {
    if (userName !== undefined) {
      this.gitUserName = userName;
    }
    if (userEmail !== undefined) {
      this.gitUserEmail = userEmail;
    }
    this.updatedAt = new Date();
  }

  updateGitHubToken(token?: string | null, username?: string | null): void {
    this.githubAccessToken = token;
    this.githubUsername = username;
    this.updatedAt = new Date();
  }

  update(data: Partial<Settings>): void {
    if (data.sshPrivateKey !== undefined) {
      this.sshPrivateKey = data.sshPrivateKey;
    }
    if (data.claudeToken !== undefined) {
      this.claudeToken = data.claudeToken;
    }
    if (data.gitUserName !== undefined) {
      this.gitUserName = data.gitUserName;
    }
    if (data.gitUserEmail !== undefined) {
      this.gitUserEmail = data.gitUserEmail;
    }
    if (data.defaultMountDirectory !== undefined) {
      this.defaultMountDirectory = data.defaultMountDirectory;
    }
    if (data.dockerSocketPath !== undefined) {
      this.dockerSocketPath = data.dockerSocketPath;
    }
    if (data.dockerStartPort !== undefined) {
      this.dockerStartPort = data.dockerStartPort;
    }
    if (data.dockerEndPort !== undefined) {
      this.dockerEndPort = data.dockerEndPort;
    }
    if (data.githubClientId !== undefined) {
      this.githubClientId = data.githubClientId;
    }
    if (data.githubClientSecret !== undefined) {
      this.githubClientSecret = data.githubClientSecret;
    }
    if (data.githubCallbackUrl !== undefined) {
      this.githubCallbackUrl = data.githubCallbackUrl;
    }
    if (data.githubFrontendRedirectUrl !== undefined) {
      this.githubFrontendRedirectUrl = data.githubFrontendRedirectUrl;
    }
    this.updatedAt = new Date();
  }
}
