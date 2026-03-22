import { Injectable } from '@nestjs/common';
import { SessionIdDto } from '../../../domain/sessions/session-id.dto';
import { SessionRuntimeService } from '../runtime/session-runtime.service';

@Injectable()
export class StopSessionInteractor {
  constructor(private readonly sessionRuntime: SessionRuntimeService) {}

  async execute(sessionId: SessionIdDto): Promise<void> {
    await this.sessionRuntime.stopSession(sessionId);
  }
}
