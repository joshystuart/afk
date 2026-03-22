import { Module } from '@nestjs/common';
import { SessionSubscriptionsModule } from '../gateways/session-subscriptions.module';
import { ChatModule } from '../interactors/sessions/chat/chat.module';
import { SessionRuntimeModule } from '../interactors/sessions/runtime/session-runtime.module';
import { DockerModule } from '../libs/docker/docker.module';
import { SessionPersistenceModule } from '../libs/sessions/session-persistence.module';
import { StreamArchiveModule } from '../libs/stream-archive/stream-archive.module';
import { MetricsController } from './metrics.controller';
import { ServerMetricsService } from './server-metrics.service';
import { StartupReconciliationService } from './startup-reconciliation.service';

@Module({
  imports: [
    DockerModule,
    ChatModule,
    StreamArchiveModule,
    SessionRuntimeModule,
    SessionSubscriptionsModule,
    SessionPersistenceModule,
  ],
  controllers: [MetricsController],
  providers: [ServerMetricsService, StartupReconciliationService],
  exports: [ServerMetricsService],
})
export class ObservabilityModule {}
