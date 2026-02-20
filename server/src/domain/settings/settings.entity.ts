import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('settings')
export class Settings {
  @PrimaryColumn('varchar', { length: 10, default: 'default' })
  id: string = 'default'; // Single settings record

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
    this.updatedAt = new Date();
  }
}
