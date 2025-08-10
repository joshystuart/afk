import { TerminalMode } from './terminal-mode.enum';

export class SessionConfigDto {
  constructor(
    public readonly repoUrl: string | null,
    public readonly branch: string,
    public readonly gitUserName: string,
    public readonly gitUserEmail: string,
    public readonly hasSSHKey: boolean,
    public readonly terminalMode: TerminalMode,
  ) {}
}
