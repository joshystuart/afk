import { Module } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { RepositoriesModule } from '../services/repositories/repositories.module';
import { SessionSubscriptionService } from './session-subscription.service';

@Module({
  imports: [RepositoriesModule, DomainModule],
  providers: [SessionSubscriptionService],
  exports: [SessionSubscriptionService],
})
export class SessionSubscriptionsModule {}
