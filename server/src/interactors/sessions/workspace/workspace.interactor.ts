import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SessionIdDto } from '../../../domain/sessions/session-id.dto';
import { SessionRepository } from '../../../domain/sessions/session.repository';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';
import { SESSION_REPOSITORY } from '../../../domain/sessions/session.tokens';
import { Session } from '../../../domain/sessions/session.entity';
import { getExecWorkingDir } from '../../../libs/docker/docker.constants';
import { WorkspaceFileListingService } from './workspace-file-listing.service';
import { WorkspaceFileIndexService } from './workspace-file-index.service';
import {
  FileEntryDto,
  ListDirectoryResponseDto,
} from './list-directory-response.dto';
import { FileContentResponseDto } from './file-content-response.dto';

@Injectable()
export class WorkspaceInteractor {
  private readonly logger = new Logger(WorkspaceInteractor.name);

  constructor(
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepo: SessionRepository,
    private readonly fileListingService: WorkspaceFileListingService,
    private readonly fileIndexService: WorkspaceFileIndexService,
  ) {}

  async listDirectory(
    sessionId: SessionIdDto,
    dirPath: string,
  ): Promise<ListDirectoryResponseDto> {
    const { session, workingDir } = await this.loadRunningSession(sessionId);
    const normalizedPath = this.normalizeInputPath(dirPath);

    const entries: FileEntryDto[] = await this.fileListingService.listDirectory(
      session.containerId as string,
      normalizedPath,
      workingDir,
    );

    return new ListDirectoryResponseDto(entries, normalizedPath);
  }

  async getFileContent(
    sessionId: SessionIdDto,
    filePath: string,
  ): Promise<FileContentResponseDto> {
    if (!filePath) {
      throw new BadRequestException('path query parameter is required');
    }

    const { session, workingDir } = await this.loadRunningSession(sessionId);

    return this.fileListingService.getFileContent(
      session.containerId as string,
      filePath,
      workingDir,
    );
  }

  async getFileIndex(sessionId: SessionIdDto): Promise<string[]> {
    const { session, workingDir } = await this.loadRunningSession(sessionId);

    return this.fileIndexService.getFileIndex(
      session.containerId as string,
      workingDir,
    );
  }

  async invalidateFileIndex(sessionId: SessionIdDto): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || !session.containerId) {
      return;
    }
    this.fileIndexService.invalidateIndex(session.containerId);
  }

  private async loadRunningSession(
    sessionId: SessionIdDto,
  ): Promise<{ session: Session; workingDir: string }> {
    const session = await this.sessionRepo.findById(sessionId);

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.RUNNING) {
      throw new BadRequestException('Session is not running');
    }

    if (!session.containerId) {
      throw new BadRequestException('Session has no associated container');
    }

    const workingDir = getExecWorkingDir(session.config?.repoUrl);
    return { session, workingDir };
  }

  private normalizeInputPath(dirPath: string | undefined): string {
    if (!dirPath || dirPath === '/' || dirPath === '') {
      return '/';
    }
    return dirPath;
  }
}
