import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { GeneralSettings } from './general-settings.embedded';
import { GitSettings } from './git-settings.embedded';
import { DockerSettings } from './docker-settings.embedded';

export { GeneralSettings } from './general-settings.embedded';
export { GitSettings } from './git-settings.embedded';
export { DockerSettings } from './docker-settings.embedded';

export interface SettingsUpdateData {
  claudeToken?: string;
  defaultMountDirectory?: string;
  sshPrivateKey?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  dockerSocketPath?: string;
  dockerStartPort?: number;
  dockerEndPort?: number;
  githubClientId?: string;
  githubClientSecret?: string;
  githubCallbackUrl?: string;
  githubFrontendRedirectUrl?: string;
}

export class SettingsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SettingsValidationError';
  }
}

@Entity('settings')
export class Settings {
  @PrimaryColumn('varchar', { length: 10, default: 'default' })
  id: string = 'default';

  @Column(() => GeneralSettings, { prefix: 'general' })
  general: GeneralSettings = new GeneralSettings();

  @Column(() => GitSettings, { prefix: 'git' })
  git: GitSettings = new GitSettings();

  @Column(() => DockerSettings, { prefix: 'docker' })
  docker: DockerSettings = new DockerSettings();

  @UpdateDateColumn()
  updatedAt: Date;

  applyDefaults(): this {
    this.git.applyDefaults();
    this.docker.applyDefaults();
    return this;
  }

  update(data: SettingsUpdateData): void {
    this.general ??= new GeneralSettings();
    this.git ??= new GitSettings();
    this.docker ??= new DockerSettings();

    if (data.claudeToken !== undefined) {
      this.general.claudeToken = data.claudeToken;
    }
    if (data.defaultMountDirectory !== undefined) {
      this.general.defaultMountDirectory = data.defaultMountDirectory;
    }
    if (data.sshPrivateKey !== undefined) {
      this.git.sshPrivateKey = data.sshPrivateKey;
    }
    if (data.gitUserName !== undefined) {
      this.git.userName = data.gitUserName;
    }
    if (data.gitUserEmail !== undefined) {
      this.git.userEmail = data.gitUserEmail;
    }
    if (data.dockerSocketPath !== undefined) {
      this.docker.socketPath = data.dockerSocketPath;
    }
    if (data.dockerStartPort !== undefined) {
      this.docker.startPort = data.dockerStartPort;
    }
    if (data.dockerEndPort !== undefined) {
      this.docker.endPort = data.dockerEndPort;
    }
    if (data.githubClientId !== undefined) {
      this.git.githubClientId = data.githubClientId;
    }
    if (data.githubClientSecret !== undefined) {
      this.git.githubClientSecret = data.githubClientSecret;
    }
    if (data.githubCallbackUrl !== undefined) {
      this.git.githubCallbackUrl = data.githubCallbackUrl;
    }
    if (data.githubFrontendRedirectUrl !== undefined) {
      this.git.githubFrontendRedirectUrl = data.githubFrontendRedirectUrl;
    }

    this.validatePortRange();
    this.updatedAt = new Date();
  }

  private validatePortRange(): void {
    const { startPort, endPort } = this.docker;

    if (!Number.isInteger(startPort) || !Number.isInteger(endPort)) {
      throw new SettingsValidationError('Port values must be integers');
    }

    if (startPort < 1 || startPort > 65535) {
      throw new SettingsValidationError(
        `Start port must be between 1 and 65535, got ${startPort}`,
      );
    }

    if (endPort < 1 || endPort > 65535) {
      throw new SettingsValidationError(
        `End port must be between 1 and 65535, got ${endPort}`,
      );
    }

    if (startPort > endPort) {
      throw new SettingsValidationError(
        `Start port (${startPort}) must not exceed end port (${endPort})`,
      );
    }
  }
}
