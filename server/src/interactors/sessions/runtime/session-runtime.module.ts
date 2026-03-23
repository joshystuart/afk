import { Module } from '@nestjs/common';
import { DockerModule } from '../../../libs/docker/docker.module';
import { GitWatcherModule } from '../../../libs/git-watcher/git-watcher.module';
import { SessionPersistenceModule } from '../../../libs/sessions/session-persistence.module';
import { SettingsPersistenceModule } from '../../../libs/settings/settings-persistence.module';
import { SessionIdleCleanupService } from './session-idle-cleanup.service';
import { SessionRuntimeService } from './session-runtime.service';

@Module({
  imports: [
    SessionPersistenceModule,
    SettingsPersistenceModule,
    DockerModule,
    GitWatcherModule,
  ],
  providers: [SessionIdleCleanupService, SessionRuntimeService],
  exports: [SessionIdleCleanupService, SessionRuntimeService],
})
export class SessionRuntimeModule {}
