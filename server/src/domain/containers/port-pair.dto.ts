export class PortPairDto {
  constructor(
    public readonly claudePort: number,
    public readonly manualPort: number,
  ) {
    this.validatePort(claudePort);
    this.validatePort(manualPort);
    if (claudePort === manualPort) {
      throw new Error('Claude and manual ports must be different');
    }
  }

  private validatePort(port: number): void {
    if (port < 1024 || port > 65535) {
      throw new Error(`Invalid port number: ${port}`);
    }
  }

  toJSON() {
    return {
      claude: this.claudePort,
      manual: this.manualPort,
    };
  }
}