import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../../libs/auth/auth.service';
import { ScheduledJobRepository } from '../../../domain/scheduled-jobs/scheduled-job.repository';
import { timingSafeEqual } from 'crypto';

const TRIGGER_TOKEN_HEADER = 'x-trigger-token';

@Injectable()
export class TriggerTokenGuard implements CanActivate {
  private readonly logger = new Logger(TriggerTokenGuard.name);

  constructor(
    private readonly authService: AuthService,
    private readonly scheduledJobRepository: ScheduledJobRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    if (await this.tryBearerAuth(request)) {
      return true;
    }

    return this.tryTriggerToken(request);
  }

  private async tryBearerAuth(request: Request): Promise<boolean> {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer' || !token) {
      return false;
    }

    try {
      const payload = await this.authService.validateToken(token);
      (request as any).user = payload;
      return true;
    } catch {
      return false;
    }
  }

  private async tryTriggerToken(request: Request): Promise<boolean> {
    const triggerToken = request.headers[TRIGGER_TOKEN_HEADER] as string;
    if (!triggerToken) {
      throw new UnauthorizedException('No authentication provided');
    }

    const jobId = request.params.id;
    if (!jobId) {
      throw new UnauthorizedException('Missing job ID');
    }

    const job = await this.scheduledJobRepository.findById(jobId);
    if (!job) {
      throw new UnauthorizedException('Invalid trigger token');
    }

    const storedBuffer = Buffer.from(job.triggerToken, 'utf-8');
    const providedBuffer = Buffer.from(triggerToken, 'utf-8');
    if (
      storedBuffer.length !== providedBuffer.length ||
      !timingSafeEqual(storedBuffer, providedBuffer)
    ) {
      this.logger.warn('Invalid trigger token attempt', { jobId });
      throw new UnauthorizedException('Invalid trigger token');
    }

    this.logger.debug(`Trigger token validated for job: ${jobId}`);
    return true;
  }
}
