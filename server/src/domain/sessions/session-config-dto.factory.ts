import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { SessionConfigDto } from './session-config.dto';

export interface SessionConfigCreateParams extends Partial<SessionConfigDto> {
  mountToHost?: boolean;
  hostMountPathOverride?: string;
  defaultMountDirectory?: string;
  skillsDirectory?: string;
}

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

  create(params: SessionConfigCreateParams): SessionConfigDto {
    const hostMountPath = this.deriveMountPath(params);
    const skillsPath =
      params.mountSkills !== false && params.skillsDirectory
        ? params.skillsDirectory
        : null;

    return new SessionConfigDto(
      params.repoUrl ?? null,
      params.branch ?? 'main',
      params.gitUserName ?? 'Claude User',
      params.gitUserEmail ?? 'claude@example.com',
      params.hasSSHKey ?? false,
      hostMountPath,
      params.cleanupOnDelete ?? false,
      skillsPath,
      params.mountSkills ?? true,
    );
  }

  private deriveMountPath(params: SessionConfigCreateParams): string | null {
    if (!params.mountToHost) {
      return null;
    }

    if (params.hostMountPathOverride) {
      return path.resolve(params.hostMountPathOverride);
    }

    if (!params.defaultMountDirectory) {
      return null;
    }

    const repoName = this.extractRepoName(params.repoUrl ?? null);
    return path.join(params.defaultMountDirectory, repoName);
  }

  private extractRepoName(repoUrl: string | null): string {
    if (!repoUrl) {
      return 'workspace';
    }

    try {
      const sshMatch = repoUrl.match(/[:/]([^/]+?)(?:\.git)?$/);
      if (sshMatch) {
        return sshMatch[1];
      }
      return (
        repoUrl
          .split('/')
          .pop()
          ?.replace(/\.git$/, '') || 'workspace'
      );
    } catch {
      return 'workspace';
    }
  }
}
