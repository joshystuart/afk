import { Module } from '@nestjs/common';
import { CreateSessionInteractor } from './create-session/create-session.interactor';
import { ListSessionsInteractor } from './list-sessions/list-sessions.interactor';
import { SessionLifecycleInteractor } from './session-lifecycle.interactor';
import { CreateSessionController } from './create-session/create-session.controller';
import { ListSessionsController } from './list-sessions/list-sessions.controller';
import { SessionLifecycleController } from './session-lifecycle.controller';
import { DockerModule } from '../../services/docker/docker.module';
import { RepositoriesModule } from '../../services/repositories/repositories.module';
import { DomainModule } from '../../domain/domain.module';
import { SettingsModule } from '../settings/settings.module';
import { SessionConfig } from '../../libs/config/session.config';
import { ResponseService } from '../../libs/response/response.service';

@Module({
  imports: [DockerModule, RepositoriesModule, DomainModule, SettingsModule],
  controllers: [
    CreateSessionController,
    ListSessionsController,
    SessionLifecycleController,
  ],
  providers: [
    CreateSessionInteractor,
    ListSessionsInteractor,
    SessionLifecycleInteractor,
    SessionConfig,
    ResponseService,
  ],
  exports: [
    CreateSessionInteractor,
    ListSessionsInteractor,
    SessionLifecycleInteractor,
  ],
})
export class SessionsModule {}
