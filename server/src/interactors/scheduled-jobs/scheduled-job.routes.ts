export enum ScheduledJobRoutes {
  BASE = '/scheduled-jobs',
  ITEM = '/:id',
  RUNS = '/:id/runs',
  TRIGGER = '/:id/trigger',
}

export enum ScheduledJobRouteParams {
  ITEM_ID = 'id',
}
