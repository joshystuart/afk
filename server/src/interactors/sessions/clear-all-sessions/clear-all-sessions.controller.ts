import { Controller, Delete, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  ClearAllSessionsInteractor,
  ClearAllSessionsResult,
} from './clear-all-sessions.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../../libs/response/response.service';
import { ApiErrorResponseDto } from '../../../libs/response/api-error-response.dto';
import { SessionRoutes } from '../session.routes';

@ApiTags('Sessions')
@Controller(SessionRoutes.BASE)
export class ClearAllSessionsController {
  constructor(
    private readonly clearAllSessionsInteractor: ClearAllSessionsInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Delete(SessionRoutes.CLEAR_ALL)
  @ApiOperation({ summary: 'Clear all sessions' })
  @ApiResponse({
    status: 200,
    description: 'All sessions cleared successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Operation failed',
    type: ApiErrorResponseDto,
  })
  async clearAllSessions(): Promise<ApiResponseType<ClearAllSessionsResult>> {
    try {
      const result = await this.clearAllSessionsInteractor.execute();
      return this.responseService.success(result);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Failed to clear sessions',
      );
    }
  }
}
