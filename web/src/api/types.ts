export const SessionStatus = {
  INITIALIZING: 'INITIALIZING',
  STARTING: 'STARTING',
  RUNNING: 'RUNNING',
  STOPPED: 'STOPPED',
  DELETING: 'DELETING',
  ERROR: 'ERROR',
} as const;

export type SessionStatus = (typeof SessionStatus)[keyof typeof SessionStatus];

export interface SessionPort {
  port: number;
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
  port?: number;
  terminalUrl?: string;
  imageId?: string;
  imageName?: string;
  hostMountPath?: string;
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionRequest {
  name?: string;
  imageId: string;
  repoUrl?: string;
  branch?: string;
  gitUserName?: string;
  gitUserEmail?: string;
  mountToHost?: boolean;
  hostMountPath?: string;
  cleanupOnDelete?: boolean;
}

export interface UpdateSessionRequest {
  name?: string;
  model?: string | null;
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
  defaultMountDirectory?: string | null;
  dockerSocketPath?: string | null;
  dockerStartPort?: number | null;
  dockerEndPort?: number | null;
  githubClientId?: string | null;
  hasGithubClientSecret: boolean;
  githubCallbackUrl?: string | null;
  githubFrontendRedirectUrl?: string | null;
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
  defaultMountDirectory?: string;
  dockerSocketPath?: string;
  dockerStartPort?: number;
  dockerEndPort?: number;
  githubClientId?: string;
  githubClientSecret?: string;
  githubCallbackUrl?: string;
  githubFrontendRedirectUrl?: string;
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

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  streamEvents?: ChatStreamEvent[];
  conversationId?: string;
  isContinuation: boolean;
  costUsd?: number;
  durationMs?: number;
  createdAt: string;
}

export interface ChatStreamEvent {
  type: string;
  [key: string]: any;
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  isExecuting: boolean;
  activeMessageId: string | null;
}

export type DockerImageStatus =
  | 'NOT_PULLED'
  | 'AVAILABLE'
  | 'PULLING'
  | 'ERROR';

export interface DockerImage {
  id: string;
  name: string;
  image: string;
  isDefault: boolean;
  isBuiltIn: boolean;
  status: DockerImageStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDockerImageRequest {
  name: string;
  image: string;
}

// Scheduled Jobs

export const ScheduleType = {
  CRON: 'cron',
  INTERVAL: 'interval',
} as const;

export type ScheduleType = (typeof ScheduleType)[keyof typeof ScheduleType];

export const ScheduledJobRunStatus = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export type ScheduledJobRunStatus =
  (typeof ScheduledJobRunStatus)[keyof typeof ScheduledJobRunStatus];

export interface ScheduledJobRunSummary {
  id: string;
  jobId: string;
  status: ScheduledJobRunStatus;
  branch?: string;
  startedAt?: string;
  createdAt: string;
}

export interface ScheduledJob {
  id: string;
  name: string;
  repoUrl: string;
  branch: string;
  createNewBranch: boolean;
  newBranchPrefix?: string;
  imageId: string;
  prompt: string;
  model?: string;
  scheduleType: ScheduleType;
  cronExpression?: string;
  intervalMs?: number;
  commitAndPush: boolean;
  enabled: boolean;
  lastRunAt?: string;
  nextRunAt?: string;
  currentRun?: ScheduledJobRunSummary;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledJobRun {
  id: string;
  jobId: string;
  status: ScheduledJobRunStatus;
  branch?: string;
  containerId?: string;
  streamEvents?: ChatStreamEvent[];
  errorMessage?: string;
  committed: boolean;
  filesChanged?: number;
  commitSha?: string;
  durationMs?: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CreateScheduledJobRequest {
  name: string;
  repoUrl: string;
  branch: string;
  createNewBranch?: boolean;
  newBranchPrefix?: string;
  imageId: string;
  prompt: string;
  model: string;
  scheduleType: ScheduleType;
  cronExpression?: string;
  intervalMs?: number;
  commitAndPush?: boolean;
}

export interface UpdateScheduledJobRequest {
  name?: string;
  repoUrl?: string;
  branch?: string;
  createNewBranch?: boolean;
  newBranchPrefix?: string;
  imageId?: string;
  prompt?: string;
  model?: string | null;
  scheduleType?: ScheduleType;
  cronExpression?: string;
  intervalMs?: number;
  commitAndPush?: boolean;
  enabled?: boolean;
}
