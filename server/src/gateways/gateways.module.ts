import { Module } from '@nestjs/common';
import { SessionGateway } from './session.gateway';
import { SessionSubscriptionService } from './session-subscription.service';
import { DockerModule } from '../services/docker/docker.module';
import { RepositoriesModule } from '../services/repositories/repositories.module';
import { DomainModule } from '../domain/domain.module';

@Module({
  imports: [DockerModule, RepositoriesModule, DomainModule],
  providers: [SessionGateway, SessionSubscriptionService],
  exports: [SessionGateway, SessionSubscriptionService],
})
export class GatewaysModule {}
