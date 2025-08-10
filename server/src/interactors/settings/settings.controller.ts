import { Controller, Get, Put, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { GetSettingsInteractor } from './get-settings/get-settings.interactor';
import { UpdateSettingsInteractor } from './update-settings/update-settings.interactor';
import { UpdateSettingsRequest } from './update-settings/update-settings-request.dto';
import { GetSettingsResponseDto } from './get-settings/get-settings-response.dto';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { ApiErrorResponseDto } from '../../libs/response/api-error-response.dto';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly getSettingsInteractor: GetSettingsInteractor,
    private readonly updateSettingsInteractor: UpdateSettingsInteractor,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Get application settings',
    description:
      'Retrieves global settings including SSH private key and Claude token',
  })
  @ApiResponse({
    status: 200,
    description: 'Settings retrieved successfully',
    type: GetSettingsResponseDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ApiErrorResponseDto,
  })
  async getSettings(): Promise<ApiResponseType<GetSettingsResponseDto>> {
    const settings = await this.getSettingsInteractor.execute();
    const response = GetSettingsResponseDto.fromDomain(settings);
    return this.responseService.success(response);
  }

  @Put()
  @ApiOperation({
    summary: 'Update application settings',
    description:
      'Updates global settings including SSH private key and Claude token',
  })
  @ApiBody({ type: UpdateSettingsRequest })
  @ApiResponse({
    status: 200,
    description: 'Settings updated successfully',
    type: GetSettingsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Validation error',
    type: ApiErrorResponseDto,
  })
  async updateSettings(
    @Body() request: UpdateSettingsRequest,
  ): Promise<ApiResponseType<GetSettingsResponseDto>> {
    const settings = await this.updateSettingsInteractor.execute(request);
    const response = GetSettingsResponseDto.fromDomain(settings);
    return this.responseService.success(response);
  }
}
