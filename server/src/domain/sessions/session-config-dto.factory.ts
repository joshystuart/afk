import { Injectable } from '@nestjs/common';
import { SessionConfigDto } from './session-config.dto';
import { TerminalMode } from './terminal-mode.enum';

@Injectable()
export class SessionConfigDtoFactory {
  createDefault(): SessionConfigDto {
    return new SessionConfigDto(
      null,
      'main',
      'Claude User',
      'claude@example.com',
      false,
      TerminalMode.SIMPLE,
    );
  }

  create(params: Partial<SessionConfigDto>): SessionConfigDto {
    return new SessionConfigDto(
      params.repoUrl ?? null,
      params.branch ?? 'main',
      params.gitUserName ?? 'Claude User',
      params.gitUserEmail ?? 'claude@example.com',
      params.hasSSHKey ?? false,
      params.terminalMode ?? TerminalMode.SIMPLE,
    );
  }
}