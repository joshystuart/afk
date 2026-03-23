export const WORKSPACE_BASE_PATH = '/workspace';
export const DEFAULT_REPO_NAME = 'workspace';
export const DEFAULT_EXEC_WORKING_DIR = `${WORKSPACE_BASE_PATH}/repo`;

/** Working directory for docker exec / Claude when a session has a git repo vs. chat-only workspace. */
export function getExecWorkingDir(repoUrl: string | null | undefined): string {
  return repoUrl ? DEFAULT_EXEC_WORKING_DIR : WORKSPACE_BASE_PATH;
}
