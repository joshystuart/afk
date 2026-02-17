export const SessionStatus = {
  INITIALIZING: 'INITIALIZING',
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  ERROR: 'ERROR',
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export interface PortPair {
  host: number;
  container: number;
}

export interface SessionConfigDto {
  image: string;
  workspacePath?: string;
}

export interface Session {
  id: string;
  name: string;
  status: SessionStatus;
  repoUrl?: string;
  branch: string;
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
  hasSshPrivateKey: boolean;
  hasClaudeToken: boolean;
  claudeToken?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  hasGitHubToken: boolean;
  githubUsername?: string;
  updatedAt: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  clone_url: string;
  ssh_url: string;
  html_url: string;
  language: string | null;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  default_branch: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface GitHubStatus {
  connected: boolean;
  username?: string;
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

export interface GitStatus {
  hasChanges: boolean;
  changedFileCount: number;
  branch: string;
}

export interface CommitAndPushRequest {
  message: string;
}

export interface CommitAndPushResponse {
  success: boolean;
  message: string;
}
