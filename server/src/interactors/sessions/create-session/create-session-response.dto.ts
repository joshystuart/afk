import { Session } from '../../../domain/sessions/session.entity';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';
import { TerminalMode } from '../../../domain/sessions/terminal-mode.enum';

export class CreateSessionResponseDto {
  id!: string;
  name!: string;
  status!: SessionStatus;
  repoUrl?: string;
  branch!: string;
  terminalMode!: TerminalMode;
  ports?: {
    claude: number;
    manual: number;
  };
  terminalUrls?: {
    claude: string;
    manual: string;
  };
  createdAt!: string;
  updatedAt!: string;

  static fromDomain(
    session: Session,
    baseUrl?: string,
  ): CreateSessionResponseDto {
    const dto = new CreateSessionResponseDto();
    dto.id = session.id.toString();
    dto.name = session.name;
    dto.status = session.status;
    dto.repoUrl = session.config.repoUrl || undefined;
    dto.branch = session.config.branch;
    dto.terminalMode = session.config.terminalMode;
    dto.createdAt = session.createdAt.toISOString();
    dto.updatedAt = session.updatedAt.toISOString();

    if (session.ports) {
      dto.ports = session.ports.toJSON();
    }

    if (baseUrl) {
      const urls = session.getTerminalUrls(baseUrl);
      if (urls) {
        dto.terminalUrls = urls;
      }
    }

    return dto;
  }
}
