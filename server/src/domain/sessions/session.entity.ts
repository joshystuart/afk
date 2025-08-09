import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SessionIdDto } from './session-id.dto';
import { SessionStatus } from './session-status.enum';
import { SessionConfigDto } from './session-config.dto';
import { PortPairDto } from '../containers/port-pair.dto';

@Entity('sessions')
export class Session {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('json')
  config: SessionConfigDto;

  @Column({
    type: 'varchar',
    enum: SessionStatus,
    default: SessionStatus.STOPPED,
  })
  status: SessionStatus;

  @Column('varchar', { length: 255, nullable: true })
  containerId: string | null;

  @Column('json', { nullable: true })
  ports: PortPairDto | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('datetime', { nullable: true })
  lastAccessedAt: Date | null;

  constructor(
    id?: SessionIdDto | string,
    name?: string,
    config?: SessionConfigDto,
    status?: SessionStatus,
    containerId?: string | null,
    ports?: PortPairDto | null,
    createdAt?: Date,
    updatedAt?: Date,
    lastAccessedAt?: Date | null,
  ) {
    if (id) {
      this.id = typeof id === 'string' ? id : id.toString();
    }
    if (name) this.name = name;
    if (config) this.config = config;
    if (status) this.status = status;
    if (containerId !== undefined) this.containerId = containerId;
    if (ports !== undefined) this.ports = ports;
    if (createdAt) this.createdAt = createdAt;
    if (updatedAt) this.updatedAt = updatedAt;
    if (lastAccessedAt !== undefined) this.lastAccessedAt = lastAccessedAt;
  }

  // Getter to maintain compatibility with existing SessionIdDto usage
  getSessionId(): SessionIdDto {
    return new SessionIdDto(this.id);
  }

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

  start(): void {
    if (this.status !== SessionStatus.STOPPED) {
      throw new Error('Can only start from stopped state');
    }
    this.status = SessionStatus.STARTING;
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
