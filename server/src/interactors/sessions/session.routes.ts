export enum SessionRoutes {
  BASE = '/sessions',
  ITEM = '/:id',
  START = '/:id/start',
  STOP = '/:id/stop',
  HEALTH = '/:id/health',
  GIT_STATUS = '/:id/git/status',
  GIT_COMMIT_PUSH = '/:id/git/commit-and-push',
}

export enum SessionRouteParams {
  ITEM_ID = 'id',
}
