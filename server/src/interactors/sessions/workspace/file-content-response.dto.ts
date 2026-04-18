export class FileContentResponseDto {
  path: string;
  content: string;
  size: number;
  truncated: boolean;
  language: string;
  binary: boolean;

  constructor(
    path: string,
    content: string,
    size: number,
    truncated: boolean,
    language: string,
    binary: boolean,
  ) {
    this.path = path;
    this.content = content;
    this.size = size;
    this.truncated = truncated;
    this.language = language;
    this.binary = binary;
  }
}
