import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as path from 'path';
import ignore from 'ignore';
import { DockerEngineService } from '../../../libs/docker/docker-engine.service';
import { FileEntryDto, FileEntryType } from './list-directory-response.dto';
import { FileContentResponseDto } from './file-content-response.dto';

const MAX_FILE_CONTENT_BYTES = 524288;

const BINARY_EXTENSIONS = new Set<string>([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.webp',
  '.bmp',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
  '.otf',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.tgz',
  '.bz2',
  '.7z',
  '.rar',
  '.mp3',
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.webm',
  '.wav',
  '.flac',
  '.ogg',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.o',
  '.a',
  '.class',
  '.jar',
  '.war',
  '.pyc',
  '.wasm',
]);

const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.json': 'json',
  '.css': 'css',
  '.scss': 'scss',
  '.sass': 'sass',
  '.less': 'less',
  '.html': 'html',
  '.htm': 'html',
  '.xml': 'xml',
  '.svg': 'xml',
  '.py': 'python',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.md': 'markdown',
  '.markdown': 'markdown',
  '.rs': 'rust',
  '.go': 'go',
  '.java': 'java',
  '.kt': 'kotlin',
  '.rb': 'ruby',
  '.php': 'php',
  '.sql': 'sql',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.hpp': 'cpp',
  '.cs': 'csharp',
  '.swift': 'swift',
  '.toml': 'toml',
  '.ini': 'ini',
  '.env': 'bash',
  '.dockerfile': 'dockerfile',
  '.makefile': 'makefile',
  '.mk': 'makefile',
};

@Injectable()
export class WorkspaceFileListingService {
  private readonly logger = new Logger(WorkspaceFileListingService.name);

  constructor(private readonly execService: DockerEngineService) {}

  resolveSafePath(workspaceBase: string, userPath: string): string {
    const normalizedBase = path.resolve(workspaceBase);
    const candidate = userPath && userPath !== '/' ? userPath : '.';
    const resolved = path.resolve(normalizedBase, candidate);

    if (
      resolved !== normalizedBase &&
      !resolved.startsWith(normalizedBase + path.sep)
    ) {
      throw new BadRequestException('Path traversal detected');
    }

    return resolved;
  }

  async listDirectory(
    containerId: string,
    dirPath: string,
    workingDir: string,
  ): Promise<FileEntryDto[]> {
    const resolved = this.resolveSafePath(workingDir, dirPath);
    const relative = this.toRelative(workingDir, resolved);

    let names = await this.listDirectoryViaGit(
      containerId,
      workingDir,
      relative,
    );

    if (names === null) {
      names = await this.listDirectoryViaFind(
        containerId,
        workingDir,
        resolved,
      );
    }

    const uniqueNames = Array.from(new Set(names)).filter((n) => n.length > 0);

    if (uniqueNames.length === 0) {
      await this.ensureDirectoryExists(containerId, resolved);
      return [];
    }

    return this.buildEntries(containerId, resolved, relative, uniqueNames);
  }

  async getFileContent(
    containerId: string,
    filePath: string,
    workingDir: string,
  ): Promise<FileContentResponseDto> {
    if (!filePath) {
      throw new BadRequestException('path query parameter is required');
    }

    const resolved = this.resolveSafePath(workingDir, filePath);
    const relative = this.toRelative(workingDir, resolved);
    const ext = path.extname(resolved).toLowerCase();
    const language = LANGUAGE_BY_EXTENSION[ext] ?? 'plaintext';
    const binary = BINARY_EXTENSIONS.has(ext);

    const sizeResult = await this.execService.execInContainer(
      containerId,
      ['stat', '-c', '%s', resolved],
      workingDir,
    );

    if (sizeResult.exitCode !== 0) {
      throw new NotFoundException(
        `File not found or not readable: ${relative}`,
      );
    }

    const size = Number.parseInt(sizeResult.stdout.trim(), 10);
    if (Number.isNaN(size)) {
      throw new BadRequestException('Unable to determine file size');
    }

    if (binary) {
      return new FileContentResponseDto(
        relative,
        '',
        size,
        false,
        language,
        true,
      );
    }

    const truncated = size > MAX_FILE_CONTENT_BYTES;
    const cmd = truncated
      ? ['head', '-c', String(MAX_FILE_CONTENT_BYTES), resolved]
      : ['cat', resolved];

    const result = await this.execService.execInContainer(
      containerId,
      cmd,
      workingDir,
    );

    if (result.exitCode !== 0) {
      throw new NotFoundException(
        `Unable to read file: ${relative} (${result.stderr || 'unknown error'})`,
      );
    }

    return new FileContentResponseDto(
      relative,
      result.stdout,
      size,
      truncated,
      language,
      false,
    );
  }

  private async listDirectoryViaGit(
    containerId: string,
    workingDir: string,
    relativeDir: string,
  ): Promise<string[] | null> {
    const pathspec = relativeDir === '.' ? '.' : `${relativeDir}/`;

    const result = await this.execService.execInContainer(
      containerId,
      [
        'git',
        'ls-files',
        '--cached',
        '--others',
        '--exclude-standard',
        '-z',
        '--',
        pathspec,
      ],
      workingDir,
    );

    if (result.exitCode !== 0) {
      return null;
    }

    const entries = result.stdout.split('\0').filter((e) => e.length > 0);
    const immediate = new Set<string>();

    for (const entry of entries) {
      const relFromDir =
        relativeDir === '.' ? entry : entry.slice(relativeDir.length + 1);

      if (!relFromDir || relFromDir.startsWith('..')) {
        continue;
      }

      const slashIdx = relFromDir.indexOf('/');
      const name = slashIdx === -1 ? relFromDir : relFromDir.slice(0, slashIdx);
      immediate.add(name);
    }

    return Array.from(immediate);
  }

  private async listDirectoryViaFind(
    containerId: string,
    workingDir: string,
    resolvedDir: string,
  ): Promise<string[]> {
    const findResult = await this.execService.execInContainer(
      containerId,
      [
        'find',
        resolvedDir,
        '-maxdepth',
        '1',
        '-mindepth',
        '1',
        '-printf',
        '%f\n',
      ],
      workingDir,
    );

    if (findResult.exitCode !== 0) {
      throw new NotFoundException(
        `Directory not found or not readable: ${resolvedDir}`,
      );
    }

    const names = findResult.stdout.split('\n').filter((n) => n.length > 0);

    const gitignoreResult = await this.execService.execInContainer(
      containerId,
      ['cat', path.join(workingDir, '.gitignore')],
      workingDir,
    );

    if (gitignoreResult.exitCode !== 0 || !gitignoreResult.stdout) {
      return names;
    }

    const ig = ignore().add(gitignoreResult.stdout);
    return names.filter((name) => !ig.ignores(name));
  }

  private async ensureDirectoryExists(
    containerId: string,
    resolvedDir: string,
  ): Promise<void> {
    const result = await this.execService.execInContainer(containerId, [
      'test',
      '-d',
      resolvedDir,
    ]);

    if (result.exitCode !== 0) {
      throw new NotFoundException(`Directory does not exist: ${resolvedDir}`);
    }
  }

  private async buildEntries(
    containerId: string,
    resolvedDir: string,
    relativeDir: string,
    names: string[],
  ): Promise<FileEntryDto[]> {
    const entries = await Promise.all(
      names.map(async (name) =>
        this.buildEntry(containerId, resolvedDir, relativeDir, name),
      ),
    );

    entries.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return entries;
  }

  private async buildEntry(
    containerId: string,
    resolvedDir: string,
    relativeDir: string,
    name: string,
  ): Promise<FileEntryDto> {
    const entryResolved = path.join(resolvedDir, name);
    const entryRelative = relativeDir === '.' ? name : `${relativeDir}/${name}`;

    const typeResult = await this.execService.execInContainer(containerId, [
      'test',
      '-d',
      entryResolved,
    ]);
    const type: FileEntryType =
      typeResult.exitCode === 0 ? 'directory' : 'file';

    if (type === 'directory') {
      return new FileEntryDto(name, entryRelative, 'directory');
    }

    const sizeResult = await this.execService.execInContainer(containerId, [
      'stat',
      '-c',
      '%s',
      entryResolved,
    ]);
    const size =
      sizeResult.exitCode === 0
        ? Number.parseInt(sizeResult.stdout.trim(), 10)
        : undefined;

    return new FileEntryDto(
      name,
      entryRelative,
      'file',
      Number.isNaN(size as number) ? undefined : size,
    );
  }

  private toRelative(workingDir: string, resolved: string): string {
    const normalizedBase = path.resolve(workingDir);
    if (resolved === normalizedBase) {
      return '.';
    }
    return path.relative(normalizedBase, resolved);
  }
}
