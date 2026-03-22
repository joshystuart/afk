import { Module } from '@nestjs/common';
import { DomainModule } from '../domain/domain.module';
import { SessionPersistenceModule } from '../libs/sessions/session-persistence.module';
import { SessionSubscriptionService } from './session-subscription.service';

@Module({
  imports: [SessionPersistenceModule, DomainModule],
  providers: [SessionSubscriptionService],
  exports: [SessionSubscriptionService],
})
export class SessionSubscriptionsModule {}
