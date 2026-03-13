import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateSessionInteractor } from './create-session/create-session.interactor';
import { ListSessionsInteractor } from './list-sessions/list-sessions.interactor';
import { SessionLifecycleInteractor } from './session-lifecycle.interactor';
import { GitInteractor } from './git.interactor';
import { CreateSessionController } from './create-session/create-session.controller';
import { ListSessionsController } from './list-sessions/list-sessions.controller';
import { GetSessionController } from './get-session.controller';
import { CheckSessionHealthController } from './check-session-health.controller';
import { StartSessionController } from './start-session.controller';
import { StopSessionController } from './stop-session.controller';
import { DeleteSessionController } from './delete-session.controller';
import { GitStatusController } from './git-status.controller';
import { GitCommitPushController } from './git-commit-push.controller';
import { ChatMessagesController } from './chat-messages.controller';
import { UpdateSessionController } from './update-session/update-session.controller';
import { UpdateSessionInteractor } from './update-session/update-session.interactor';
import { DockerModule } from '../../services/docker/docker.module';
import { RepositoriesModule } from '../../services/repositories/repositories.module';
import { DomainModule } from '../../domain/domain.module';
import { DockerImagesModule } from '../../domain/docker-images/docker-images.module';
import { SettingsModule } from '../settings/settings.module';
import { GitWatcherModule } from '../../services/git-watcher/git-watcher.module';
import { ChatModule } from '../../services/chat/chat.module';
import { SessionConfig } from '../../libs/config/session.config';
import { ResponseService } from '../../libs/response/response.service';
import { Session } from '../../domain/sessions/session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
    DockerModule,
    RepositoriesModule,
    DomainModule,
    DockerImagesModule,
    SettingsModule,
    GitWatcherModule,
    ChatModule,
  ],
  controllers: [
    CreateSessionController,
    ListSessionsController,
    GetSessionController,
    CheckSessionHealthController,
    StartSessionController,
    StopSessionController,
    DeleteSessionController,
    GitStatusController,
    GitCommitPushController,
    ChatMessagesController,
    UpdateSessionController,
  ],
  providers: [
    CreateSessionInteractor,
    ListSessionsInteractor,
    SessionLifecycleInteractor,
    GitInteractor,
    UpdateSessionInteractor,
    SessionConfig,
    ResponseService,
  ],
  exports: [
    CreateSessionInteractor,
    ListSessionsInteractor,
    SessionLifecycleInteractor,
    GitInteractor,
  ],
})
export class SessionsModule {}
