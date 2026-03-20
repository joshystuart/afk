export enum ScheduledJobRoutes {
  BASE = '/scheduled-jobs',
  ITEM = '/:id',
  RUNS = '/:id/runs',
  TRIGGER = '/:id/trigger',
  RUN_STREAM = '/runs/:runId/stream',
}

export enum ScheduledJobRouteParams {
  ITEM_ID = 'id',
  RUN_ID = 'runId',
}
