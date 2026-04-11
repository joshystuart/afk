import { Module } from '@nestjs/common';
import { SessionGateway } from './session.gateway';
import { DockerModule } from '../libs/docker/docker.module';
import { SessionPersistenceModule } from '../libs/sessions/session-persistence.module';
import { DomainModule } from '../domain/domain.module';
import { GitWatcherModule } from '../libs/git-watcher/git-watcher.module';
import { ChatModule } from '../interactors/sessions/chat/chat.module';
import { ScheduledJobsDomainModule } from '../domain/scheduled-jobs/scheduled-jobs.module';
import { ScheduledJobGatewayResponseFactory } from './scheduled-job-gateway-response.factory';
import { SessionGatewayChatService } from './session-gateway-chat.service';
import { SessionGatewayFanoutService } from './session-gateway-fanout.service';
import { SessionGatewayJobRunsService } from './session-gateway-job-runs.service';
import { SessionGatewaySubscriptionsService } from './session-gateway-subscriptions.service';
import { SessionGatewayTerminalService } from './session-gateway-terminal.service';
import { SessionSubscriptionsModule } from './session-subscriptions.module';

@Module({
  imports: [
    DockerModule,
    SessionPersistenceModule,
    DomainModule,
    GitWatcherModule,
    ChatModule,
    ScheduledJobsDomainModule,
    SessionSubscriptionsModule,
  ],
  providers: [
    SessionGateway,
    SessionGatewayChatService,
    SessionGatewayFanoutService,
    SessionGatewayJobRunsService,
    SessionGatewaySubscriptionsService,
    SessionGatewayTerminalService,
    ScheduledJobGatewayResponseFactory,
  ],
  exports: [SessionGateway, SessionSubscriptionsModule],
})
export class GatewaysModule {}
