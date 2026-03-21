import { Column } from 'typeorm';

export class GitSettings {
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

  updateGitHubToken(token?: string | null, username?: string | null): void {
    this.githubAccessToken = token;
    this.githubUsername = username;
  }
}
