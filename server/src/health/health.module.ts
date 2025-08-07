import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { DockerHealthIndicator } from './docker-health.indicator';
import { DockerModule } from '../services/docker/docker.module';

@Module({
  imports: [
    TerminusModule,
    DockerModule,
  ],
  controllers: [HealthController],
  providers: [DockerHealthIndicator],
})
export class HealthModule {}