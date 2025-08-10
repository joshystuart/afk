import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionRepository } from './session.repository';
import { Session } from '../../domain/sessions/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  providers: [SessionRepository],
  exports: [SessionRepository],
})
export class RepositoriesModule {}
