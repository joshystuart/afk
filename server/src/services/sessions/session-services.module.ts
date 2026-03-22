import { Module } from '@nestjs/common';
import { SessionIdleCleanupService } from './session-idle-cleanup.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { SettingsPersistenceModule } from '../../libs/settings/settings-persistence.module';
import { DockerModule } from '../docker/docker.module';
import { GitWatcherModule } from '../git-watcher/git-watcher.module';
import { SessionRuntimeService } from './session-runtime.service';

@Module({
  imports: [
    RepositoriesModule,
    SettingsPersistenceModule,
    DockerModule,
    GitWatcherModule,
  ],
  providers: [SessionIdleCleanupService, SessionRuntimeService],
  exports: [SessionIdleCleanupService, SessionRuntimeService],
})
export class SessionServicesModule {}
