import { Module } from '@nestjs/common';
import { SessionIdleCleanupService } from './session-idle-cleanup.service';
import { RepositoriesModule } from '../repositories/repositories.module';
import { SettingsModule } from '../../interactors/settings/settings.module';
import { SessionsModule } from '../../interactors/sessions/sessions.module';

@Module({
  imports: [RepositoriesModule, SettingsModule, SessionsModule],
  providers: [SessionIdleCleanupService],
  exports: [SessionIdleCleanupService],
})
export class SessionServicesModule {}
