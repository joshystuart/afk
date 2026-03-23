import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SESSION_REPOSITORY } from '../../domain/sessions/session.tokens';
import { Session } from '../../domain/sessions/session.entity';
import { SessionRepositoryImpl } from './session.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  providers: [
    SessionRepositoryImpl,
    {
      provide: SESSION_REPOSITORY,
      useExisting: SessionRepositoryImpl,
    },
  ],
  exports: [SESSION_REPOSITORY],
})
export class SessionPersistenceModule {}
