export class PortPairDto {
  constructor(public readonly port: number) {
    this.validatePort(port);
  }

  private validatePort(port: number): void {
    if (port < 1024 || port > 65535) {
      throw new Error(`Invalid port number: ${port}`);
    }
  }

  toJSON() {
    return {
      port: this.port,
    };
  }
}
