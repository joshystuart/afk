import {
  BadRequestException,
  Controller,
  Get,
  Logger,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { WorkspaceInteractor } from './workspace.interactor';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../../libs/response/response.service';
import { SessionIdDtoFactory } from '../../../domain/sessions/session-id-dto.factory';
import { ApiErrorResponseDto } from '../../../libs/response/api-error-response.dto';
import { SessionRoutes, SessionRouteParams } from '../session.routes';
import { WorkspaceRoutes } from './workspace.routes';
import { ListDirectoryResponseDto } from './list-directory-response.dto';
import { FileContentResponseDto } from './file-content-response.dto';

interface FileIndexResponse {
  files: string[];
}

@ApiTags('Sessions')
@Controller(SessionRoutes.BASE)
export class WorkspaceController {
  private readonly logger = new Logger(WorkspaceController.name);

  constructor(
    private readonly workspaceInteractor: WorkspaceInteractor,
    private readonly responseService: ResponseService,
    private readonly sessionIdFactory: SessionIdDtoFactory,
  ) {}

  @Get(WorkspaceRoutes.LIST_FILES)
  @ApiOperation({ summary: 'List directory entries for a session workspace' })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiQuery({
    name: 'path',
    required: false,
    description: 'Relative directory path (defaults to /)',
  })
  @ApiResponse({ status: 200, description: 'Directory listing retrieved' })
  @ApiResponse({
    status: 400,
    description: 'Invalid path or session not running',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
    type: ApiErrorResponseDto,
  })
  async listDirectory(
    @Param(SessionRouteParams.ITEM_ID) id: string,
    @Query('path') dirPath: string = '/',
  ): Promise<ApiResponseType<ListDirectoryResponseDto>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      const result = await this.workspaceInteractor.listDirectory(
        sessionId,
        dirPath,
      );
      return this.responseService.success(result);
    } catch (error) {
      this.handleError('listDirectory', id, error);
    }
  }

  @Get(WorkspaceRoutes.FILE_CONTENT)
  @ApiOperation({ summary: 'Get file content for a workspace file' })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiQuery({
    name: 'path',
    required: true,
    description: 'Relative file path',
  })
  @ApiResponse({ status: 200, description: 'File content retrieved' })
  @ApiResponse({
    status: 400,
    description: 'Invalid path or session not running',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session or file not found',
    type: ApiErrorResponseDto,
  })
  async getFileContent(
    @Param(SessionRouteParams.ITEM_ID) id: string,
    @Query('path') filePath: string,
  ): Promise<ApiResponseType<FileContentResponseDto>> {
    if (!filePath) {
      throw new BadRequestException('path query parameter is required');
    }

    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      const result = await this.workspaceInteractor.getFileContent(
        sessionId,
        filePath,
      );
      return this.responseService.success(result);
    } catch (error) {
      this.handleError('getFileContent', id, error);
    }
  }

  @Get(WorkspaceRoutes.FILE_INDEX)
  @ApiOperation({
    summary: 'Get flat workspace file index for autocomplete',
  })
  @ApiParam({ name: SessionRouteParams.ITEM_ID, description: 'Session ID' })
  @ApiResponse({ status: 200, description: 'File index retrieved' })
  @ApiResponse({
    status: 400,
    description: 'Session not running',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
    type: ApiErrorResponseDto,
  })
  async getFileIndex(
    @Param(SessionRouteParams.ITEM_ID) id: string,
  ): Promise<ApiResponseType<FileIndexResponse>> {
    try {
      const sessionId = this.sessionIdFactory.fromString(id);
      const files = await this.workspaceInteractor.getFileIndex(sessionId);
      return this.responseService.success({ files });
    } catch (error) {
      this.handleError('getFileIndex', id, error);
    }
  }

  private handleError(operation: string, sessionId: string, error: any): never {
    this.logger.error(`Workspace ${operation} failed`, {
      sessionId,
      error: error?.message,
    });

    if (
      error instanceof NotFoundException ||
      error instanceof BadRequestException
    ) {
      throw error;
    }

    const message = error?.message ?? 'Unknown error';
    if (message === 'Session not found') {
      throw new NotFoundException(message);
    }
    throw new BadRequestException(message);
  }
}
