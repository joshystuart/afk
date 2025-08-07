export const SessionStatus = {
  PENDING: 'pending',
  CREATING_CONTAINER: 'creating_container',
  STARTING_CONTAINER: 'starting_container',
  RUNNING: 'running',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  FAILED: 'failed',
  DELETING: 'deleting',
} as const;

export type SessionStatus = typeof SessionStatus[keyof typeof SessionStatus];

export const TerminalMode = {
  CLAUDE: 'claude',
  MANUAL: 'manual',
  DUAL: 'dual',
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
  status: SessionStatus;
  config: SessionConfigDto;
  containerId?: string;
  sshPort?: PortPair;
  httpPort?: PortPair;
  terminalUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  config: SessionConfigDto;
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

export interface ApiError {
  success: false;
  error: {
    message: string;
    code: string;
    timestamp: string;
  };
  statusCode: number;
}