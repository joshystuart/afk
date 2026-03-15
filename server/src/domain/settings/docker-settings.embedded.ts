import { Column } from 'typeorm';

export class DockerSettings {
  static readonly DEFAULT_SOCKET_PATH = '/var/run/docker.sock';
  static readonly DEFAULT_START_PORT = 7681;
  static readonly DEFAULT_END_PORT = 7780;

  @Column('varchar', {
    length: 500,
    nullable: true,
    default: DockerSettings.DEFAULT_SOCKET_PATH,
  })
  socketPath: string = DockerSettings.DEFAULT_SOCKET_PATH;

  @Column('int', {
    nullable: true,
    default: DockerSettings.DEFAULT_START_PORT,
  })
  startPort: number = DockerSettings.DEFAULT_START_PORT;

  @Column('int', {
    nullable: true,
    default: DockerSettings.DEFAULT_END_PORT,
  })
  endPort: number = DockerSettings.DEFAULT_END_PORT;

  applyDefaults(): void {
    this.socketPath ??= DockerSettings.DEFAULT_SOCKET_PATH;
    this.startPort ??= DockerSettings.DEFAULT_START_PORT;
    this.endPort ??= DockerSettings.DEFAULT_END_PORT;
  }
}
