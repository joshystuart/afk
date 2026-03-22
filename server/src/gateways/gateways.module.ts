import { Module } from '@nestjs/common';
import { SessionGateway } from './session.gateway';
import { SessionSubscriptionService } from './session-subscription.service';
import { DockerModule } from '../services/docker/docker.module';
import { RepositoriesModule } from '../services/repositories/repositories.module';
import { DomainModule } from '../domain/domain.module';
import { GitWatcherModule } from '../services/git-watcher/git-watcher.module';
import { ChatModule } from '../services/chat/chat.module';
import { ScheduledJobsDomainModule } from '../domain/scheduled-jobs/scheduled-jobs.module';
import { ScheduledJobGatewayResponseFactory } from './scheduled-job-gateway-response.factory';

@Module({
  imports: [
    DockerModule,
    RepositoriesModule,
    DomainModule,
    GitWatcherModule,
    ChatModule,
    ScheduledJobsDomainModule,
  ],
  providers: [
    SessionGateway,
    SessionSubscriptionService,
    ScheduledJobGatewayResponseFactory,
  ],
  exports: [SessionGateway, SessionSubscriptionService],
})
export class GatewaysModule {}
