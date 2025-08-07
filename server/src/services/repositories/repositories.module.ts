import { Module } from '@nestjs/common';
import { SessionRepository } from './session.repository';

@Module({
  providers: [SessionRepository],
  exports: [SessionRepository],
})
export class RepositoriesModule {}