import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { DockerEngineService } from '../services/docker/docker-engine.service';

@Injectable()
export class DockerHealthIndicator extends HealthIndicator {
  constructor(
    private readonly dockerEngine: DockerEngineService,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.dockerEngine.ping();
      return this.getStatus(key, true, { message: 'Docker is accessible' });
    } catch (error) {
      const result = this.getStatus(key, false, { 
        message: 'Docker is not accessible',
        error: error.message,
      });
      throw new HealthCheckError('Docker check failed', result);
    }
  }
}