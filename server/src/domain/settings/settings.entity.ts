export class Settings {
  constructor(
    public sshPrivateKey?: string,
    public claudeToken?: string,
    public gitUserName?: string,
    public gitUserEmail?: string,
    public updatedAt: Date = new Date(),
  ) {}

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