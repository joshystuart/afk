export type FileEntryType = 'file' | 'directory';

export class FileEntryDto {
  name: string;
  path: string;
  type: FileEntryType;
  size?: number;

  constructor(
    name: string,
    path: string,
    type: FileEntryType,
    size?: number,
  ) {
    this.name = name;
    this.path = path;
    this.type = type;
    if (size !== undefined) {
      this.size = size;
    }
  }
}

export class ListDirectoryResponseDto {
  entries: FileEntryDto[];
  path: string;

  constructor(entries: FileEntryDto[], path: string) {
    this.entries = entries;
    this.path = path;
  }
}
