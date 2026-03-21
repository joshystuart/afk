import { Session } from '../../../domain/sessions/session.entity';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';

export class CreateSessionResponseDto {
  id!: string;
  name!: string;
  status!: SessionStatus;
  repoUrl?: string;
  branch!: string;
  port?: number;
  terminalUrl?: string;
  imageId?: string;
  imageName?: string;
  hostMountPath?: string;
  model?: string;
  permissionMode?: string;
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
    dto.imageId = session.imageId || undefined;
    dto.imageName = session.imageName || undefined;
    dto.hostMountPath = session.config.hostMountPath || undefined;
    dto.model = session.model || undefined;
    dto.permissionMode = session.permissionMode || undefined;
    dto.createdAt = session.createdAt.toISOString();
    dto.updatedAt = session.updatedAt.toISOString();

    if (session.ports) {
      dto.port = session.ports.port;
    }

    if (baseUrl) {
      const url = session.getTerminalUrl(baseUrl);
      if (url) {
        dto.terminalUrl = url;
      }
    }

    return dto;
  }
}
