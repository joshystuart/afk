export const ROOM_PREFIX = 'session:';
export const JOB_RUN_ROOM_PREFIX = 'job-run:';

export const SOCKET_EVENTS = {
  subscribeSession: 'subscribe.session',
  unsubscribeSession: 'unsubscribe.session',
  subscribeLogs: 'subscribe.logs',
  unsubscribeLogs: 'unsubscribe.logs',
  subscribeJobRun: 'subscribe.job.run',
  unsubscribeJobRun: 'unsubscribe.job.run',
  chatSend: 'chat.send',
  chatCancel: 'chat.cancel',
  chatStatus: 'chat.status',
  chatStarted: 'chat.started',
  chatStream: 'chat.stream',
  chatComplete: 'chat.complete',
  chatError: 'chat.error',
  chatCancelled: 'chat.cancelled',
  logData: 'log.data',
  logsError: 'logs.error',
  logsSubscribed: 'logs.subscribed',
  logsUnsubscribed: 'logs.unsubscribed',
  jobRunSubscribed: 'job.run.subscribed',
  jobRunUnsubscribed: 'job.run.unsubscribed',
  jobRunStream: 'job.run.stream',
  jobRunUpdated: 'job.run.updated',
  jobRunError: 'job.run.error',
  scheduledJobUpdated: 'scheduled.job.updated',
  scheduledJobRunUpdated: 'scheduled.job.run.updated',
  subscriptionSuccess: 'subscription.success',
  subscriptionError: 'subscription.error',
  unsubscriptionSuccess: 'unsubscription.success',
  sessionGitStatus: 'session.git.status',
  sessionUpdated: 'session.updated',
  sessionStatusChanged: 'session.status.changed',
  sessionDeleteProgress: 'session.delete.progress',
  sessionDeleted: 'session.deleted',
  sessionDeleteFailed: 'session.delete.failed',
} as const;

export const CHAT_STATUS = {
  executing: 'executing',
  idle: 'idle',
} as const;

export const GATEWAY_EVENTS = {
  gitStatusChanged: 'git.status.changed',
} as const;

export function getSessionRoom(sessionId: string): string {
  return `${ROOM_PREFIX}${sessionId}`;
}

export function getJobRunRoom(runId: string): string {
  return `${JOB_RUN_ROOM_PREFIX}${runId}`;
}
