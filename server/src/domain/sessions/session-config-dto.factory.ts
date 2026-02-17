import { Injectable } from '@nestjs/common';
import { SessionConfigDto } from './session-config.dto';

@Injectable()
export class SessionConfigDtoFactory {
  createDefault(): SessionConfigDto {
    return new SessionConfigDto(
      null,
      'main',
      'Claude User',
      'claude@example.com',
      false,
    );
  }

  create(params: Partial<SessionConfigDto>): SessionConfigDto {
    return new SessionConfigDto(
      params.repoUrl ?? null,
      params.branch ?? 'main',
      params.gitUserName ?? 'Claude User',
      params.gitUserEmail ?? 'claude@example.com',
      params.hasSSHKey ?? false,
    );
  }
}
