export enum SessionRoutes {
  BASE = '/sessions',
  ITEM = '/:id',
  START = '/:id/start',
  STOP = '/:id/stop',
  RESTART = '/:id/restart',
  HEALTH = '/:id/health',
}

export enum SessionRouteParams {
  ITEM_ID = 'id',
}