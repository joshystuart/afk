export const SessionStatus = {
  INITIALIZING: 'INITIALIZING',
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
} as const;

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus];

export const TerminalMode = {
  SIMPLE: 'SIMPLE',
  DUAL: 'DUAL',
} as const;

export type TerminalMode = typeof TerminalMode[keyof typeof TerminalMode];

export interface PortPair {
  host: number;
  container: number;
}

export interface SessionConfigDto {
  image: string;
  mode: TerminalMode;
  workspacePath?: string;
}

export interface Session {
  id: string;
  name: string;
  status: SessionStatus;
  repoUrl?: string;
  branch: string;
  terminalMode: TerminalMode;
  ports?: {
    claude: number;
    manual: number;
  };
  terminalUrls?: {
    claude: string;
    manual: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  name: string;
  repoUrl?: string;
  branch?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  terminalMode?: TerminalMode;
}

export interface CreateSessionResponse {
  session: Session;
}

export interface ListSessionsResponse {
  sessions: Session[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  statusCode: number;
}

export interface Settings {
  sshPrivateKey?: string;
  claudeToken?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  updatedAt: string;
}

export interface UpdateSettingsRequest {
  sshPrivateKey?: string;
  claudeToken?: string;
  gitUserName?: string;
  gitUserEmail?: string;
}

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    timestamp: string;
  };
  statusCode: number;
}