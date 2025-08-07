import { Module } from '@nestjs/common';
import { SessionFactory } from './sessions/session.factory';
import { SessionIdDtoFactory } from './sessions/session-id-dto.factory';
import { SessionConfigDtoFactory } from './sessions/session-config-dto.factory';
import { PortPairDtoFactory } from './containers/port-pair-dto.factory';

@Module({
  providers: [
    SessionFactory,
    SessionIdDtoFactory,
    SessionConfigDtoFactory,
    PortPairDtoFactory,
  ],
  exports: [
    SessionFactory,
    SessionIdDtoFactory,
    SessionConfigDtoFactory,
    PortPairDtoFactory,
  ],
})
export class DomainModule {}