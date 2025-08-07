import { SessionIdDto } from './session-id.dto';
import { SessionStatus } from './session-status.enum';
import { SessionConfigDto } from './session-config.dto';
import { PortPairDto } from '../containers/port-pair.dto';

export class Session {
  constructor(
    public readonly id: SessionIdDto,
    public readonly name: string,
    public readonly config: SessionConfigDto,
    public status: SessionStatus,
    public containerId: string | null,
    public ports: PortPairDto | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public lastAccessedAt: Date | null,
  ) {}

  assignContainer(containerId: string, ports: PortPairDto): void {
    this.containerId = containerId;
    this.ports = ports;
    this.status = SessionStatus.STARTING;
    this.updatedAt = new Date();
  }

  markAsRunning(): void {
    if (this.status !== SessionStatus.STARTING) {
      throw new Error('Can only mark as running from starting state');
    }
    this.status = SessionStatus.RUNNING;
    this.updatedAt = new Date();
  }

  markAsAccessed(): void {
    this.lastAccessedAt = new Date();
  }

  stop(): void {
    this.status = SessionStatus.STOPPED;
    this.updatedAt = new Date();
  }

  markAsError(): void {
    this.status = SessionStatus.ERROR;
    this.updatedAt = new Date();
  }

  canBeDeleted(): boolean {
    return [SessionStatus.STOPPED, SessionStatus.ERROR].includes(this.status);
  }

  isRunning(): boolean {
    return this.status === SessionStatus.RUNNING;
  }

  getTerminalUrls(baseUrl: string): { claude: string; manual: string } | null {
    if (!this.ports || this.status !== SessionStatus.RUNNING) {
      return null;
    }
    
    return {
      claude: `${baseUrl}:${this.ports.claudePort}`,
      manual: `${baseUrl}:${this.ports.manualPort}`,
    };
  }
}