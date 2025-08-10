import { Injectable } from '@nestjs/common';
import { Session } from './session.entity';
import { SessionIdDtoFactory } from './session-id-dto.factory';
import { SessionConfigDto } from './session-config.dto';
import { SessionStatus } from './session-status.enum';
import { SessionIdDto } from './session-id.dto';
import { PortPairDto } from '../containers/port-pair.dto';

@Injectable()
export class SessionFactory {
  constructor(private readonly sessionIdFactory: SessionIdDtoFactory) {}

  create(name: string, config: SessionConfigDto): Session {
    const sessionId = this.sessionIdFactory.generate();
    return new Session(
      sessionId,
      name,
      config,
      SessionStatus.INITIALIZING,
      null,
      null,
      new Date(),
      new Date(),
      null,
    );
  }

  fromData(data: {
    id: string;
    name: string;
    config: SessionConfigDto;
    status: SessionStatus;
    containerId?: string;
    ports?: PortPairDto;
    createdAt: Date;
    updatedAt: Date;
    lastAccessedAt?: Date;
  }): Session {
    return new Session(
      data.id,
      data.name,
      data.config,
      data.status,
      data.containerId || null,
      data.ports || null,
      data.createdAt,
      data.updatedAt,
      data.lastAccessedAt || null,
    );
  }
}
