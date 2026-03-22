import { Module } from '@nestjs/common';
import { ServerMetricsService } from './server-metrics.service';
import { StartupReconciliationService } from './startup-reconciliation.service';
import { MetricsController } from './metrics.controller';
import { DockerModule } from '../docker/docker.module';
import { ChatModule } from '../chat/chat.module';
import { StreamArchiveModule } from '../stream-archive/stream-archive.module';
import { SessionServicesModule } from '../sessions/session-services.module';
import { SessionSubscriptionsModule } from '../../gateways/session-subscriptions.module';
import { RepositoriesModule } from '../repositories/repositories.module';

@Module({
  imports: [
    DockerModule,
    ChatModule,
    StreamArchiveModule,
    SessionServicesModule,
    SessionSubscriptionsModule,
    RepositoriesModule,
  ],
  controllers: [MetricsController],
  providers: [ServerMetricsService, StartupReconciliationService],
  exports: [ServerMetricsService],
})
export class ObservabilityModule {}
