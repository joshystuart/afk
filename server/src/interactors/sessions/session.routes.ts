export enum SessionRoutes {
  BASE = '/sessions',
  CLEAR_ALL = '/clear-all',
  ITEM = '/:id',
  START = '/:id/start',
  STOP = '/:id/stop',
  HEALTH = '/:id/health',
  GIT_STATUS = '/:id/git/status',
  GIT_COMMIT_PUSH = '/:id/git/commit-and-push',
  MESSAGES = '/:id/messages',
  MESSAGE_STREAM = '/:id/messages/:messageId/stream',
  WORKSPACE_FILES = '/:id/files',
  WORKSPACE_FILE_CONTENT = '/:id/files/content',
  WORKSPACE_FILE_INDEX = '/:id/files/index',
}

export enum SessionRouteParams {
  ITEM_ID = 'id',
  MESSAGE_ID = 'messageId',
}
