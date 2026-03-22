import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  ServerMetricsService,
  ServerMetricsSnapshot,
} from './server-metrics.service';

@ApiTags('Observability')
@Controller('api/metrics')
export class MetricsController {
  constructor(private readonly serverMetrics: ServerMetricsService) {}

  @Get()
  @ApiOperation({ summary: 'Get server metrics snapshot' })
  @ApiResponse({
    status: 200,
    description:
      'Current server metrics including streams, executions, and archive stats',
  })
  async getMetrics(): Promise<ServerMetricsSnapshot> {
    return this.serverMetrics.getSnapshot();
  }
}
