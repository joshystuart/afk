import { Injectable, Inject, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { SETTINGS_REPOSITORY } from '../../../domain/settings/settings.tokens';
import { SettingsRepository } from '../../../domain/settings/settings.repository';
import { ListSkillsResponseDto } from './list-skills-response.dto';

const MAX_SKILLS = 200;

@Injectable()
export class ListSkillsInteractor {
  private readonly logger = new Logger(ListSkillsInteractor.name);

  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async execute(): Promise<ListSkillsResponseDto> {
    const settings = await this.settingsRepository.get();
    const skillsDir = settings.general?.skillsDirectory;

    if (!skillsDir) {
      return { skills: [] };
    }

    try {
      const entries = await fs.readdir(skillsDir, { withFileTypes: true });
      const subdirs = entries
        .filter((e) => e.isDirectory())
        .slice(0, MAX_SKILLS);

      const skills = await Promise.all(
        subdirs.map(async (dir) => {
          const skillMdPath = path.join(skillsDir, dir.name, 'SKILL.md');
          const description = await this.readFirstLine(skillMdPath);
          return { name: dir.name, description };
        }),
      );

      return { skills };
    } catch (error: any) {
      if (error?.code === 'ENOENT' || error?.code === 'EACCES') {
        this.logger.warn(
          `Cannot read skills directory "${skillsDir}": ${error.code}`,
        );
        return { skills: [] };
      }
      throw error;
    }
  }

  private async readFirstLine(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const firstLine = content.split('\n').find((line) => line.trim() !== '');
      return firstLine?.replace(/^#\s*/, '').trim() || '';
    } catch {
      return '';
    }
  }
}
