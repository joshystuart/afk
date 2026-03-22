import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CreateSessionInteractor } from './create-session/create-session.interactor';
import { ListSessionsInteractor } from './list-sessions/list-sessions.interactor';
import { SessionGitInteractor } from './session-git.interactor';
import { CreateSessionController } from './create-session/create-session.controller';
import { CreateSessionRequestService } from './create-session/create-session-request.service';
import { CreateSessionStartupService } from './create-session/create-session-startup.service';
import { ListSessionsController } from './list-sessions/list-sessions.controller';
import { GetSessionController } from './get-session.controller';
import { CheckSessionHealthController } from './check-session-health.controller';
import { StartSessionController } from './start-session.controller';
import { StopSessionController } from './stop-session.controller';
import { ClearAllSessionsController } from './clear-all-sessions.controller';
import { DeleteSessionController } from './delete-session.controller';
import { GitStatusController } from './git-status.controller';
import { GitCommitPushController } from './git-commit-push.controller';
import { ChatMessagesController } from './chat-messages.controller';
import { GetChatMessageStreamController } from './get-chat-message-stream.controller';
import { UpdateSessionController } from './update-session/update-session.controller';
import { UpdateSessionInteractor } from './update-session/update-session.interactor';
import { DockerModule } from '../../libs/docker/docker.module';
import { DomainModule } from '../../domain/domain.module';
import { DockerImagesModule } from '../../domain/docker-images/docker-images.module';
import { GitWatcherModule } from '../../libs/git-watcher/git-watcher.module';
import { GitModule } from '../../libs/git/git.module';
import { ChatModule } from './chat/chat.module';
import { ClearAllSessionsInteractor } from './clear-all-sessions.interactor';
import { SessionConfig } from '../../libs/config/session.config';
import { ResponseModule } from '../../libs/response/response.module';
import { SettingsPersistenceModule } from '../../libs/settings/settings-persistence.module';
import { SessionPersistenceModule } from '../../libs/sessions/session-persistence.module';
import { MountPathValidator } from '../../libs/validators/mount-path.validator';
import { Session } from '../../domain/sessions/session.entity';
import { CheckSessionHealthInteractor } from './check-session-health/check-session-health.interactor';
import { DeleteSessionInteractor } from './delete-session/delete-session.interactor';
import { GetSessionInfoInteractor } from './get-session-info/get-session-info.interactor';
import { SessionHealthMonitorService } from './session-health-monitor.service';
import { StartSessionInteractor } from './start-session/start-session.interactor';
import { StopSessionInteractor } from './stop-session/stop-session.interactor';
import { SessionRuntimeModule } from './runtime/session-runtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
    ResponseModule,
    DockerModule,
    SessionPersistenceModule,
    DomainModule,
    DockerImagesModule,
    SettingsPersistenceModule,
    GitWatcherModule,
    GitModule,
    ChatModule,
    SessionRuntimeModule,
  ],
  controllers: [
    CreateSessionController,
    ListSessionsController,
    GetSessionController,
    CheckSessionHealthController,
    StartSessionController,
    StopSessionController,
    ClearAllSessionsController,
    DeleteSessionController,
    GitStatusController,
    GitCommitPushController,
    ChatMessagesController,
    GetChatMessageStreamController,
    UpdateSessionController,
  ],
  providers: [
    CreateSessionInteractor,
    CreateSessionRequestService,
    CreateSessionStartupService,
    ListSessionsInteractor,
    ClearAllSessionsInteractor,
    SessionGitInteractor,
    UpdateSessionInteractor,
    StartSessionInteractor,
    StopSessionInteractor,
    DeleteSessionInteractor,
    CheckSessionHealthInteractor,
    GetSessionInfoInteractor,
    SessionHealthMonitorService,
    SessionConfig,
    MountPathValidator,
  ],
  exports: [
    CreateSessionInteractor,
    ListSessionsInteractor,
    SessionGitInteractor,
  ],
})
export class SessionsModule {}
