import { PortPairDto } from './port-pair.dto';

export enum ContainerHealth {
  UNKNOWN = 'unknown',
  STARTING = 'starting',
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  NONE = 'none',
}

export interface ContainerInfo {
  id: string;
  name: string;
  state: string;
  health: ContainerHealth;
  created: Date;
  ports: Record<string, number> | null;
  labels: Record<string, string>;
}

export interface ContainerStats {
  cpu: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    rx: number;
    tx: number;
  };
}

export interface ContainerCreateOptions {
  sessionId: string;
  sessionName: string;
  imageName: string;
  repoUrl?: string;
  branch?: string;
  gitUserName: string;
  gitUserEmail: string;
  sshPrivateKey?: string;
  ports: PortPairDto;
  claudeToken?: string;
  githubToken?: string;
  hostMountPath?: string;
  skillsPath?: string;
}

export interface EphemeralContainerCreateOptions {
  jobId: string;
  runId: string;
  imageName: string;
  repoUrl: string;
  branch: string;
  gitUserName: string;
  gitUserEmail: string;
  sshPrivateKey?: string;
  ports: PortPairDto;
  claudeToken?: string;
  githubToken?: string;
}
