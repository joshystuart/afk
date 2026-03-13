import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { DockerImageService } from '../../services/docker/docker-image.service';
import {
  ResponseService,
  ApiResponse as ApiResponseType,
} from '../../libs/response/response.service';
import { DockerImageResponseDto } from './docker-image-response.dto';
import { CreateDockerImageRequest } from './create-docker-image-request.dto';
import { ApiErrorResponseDto } from '../../libs/response/api-error-response.dto';

@ApiTags('Docker Images')
@Controller('docker/images')
export class DockerImagesController {
  constructor(
    private readonly dockerImageService: DockerImageService,
    private readonly responseService: ResponseService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all Docker images' })
  @ApiResponse({
    status: 200,
    description: 'List of Docker images',
    type: [DockerImageResponseDto],
  })
  async list(): Promise<ApiResponseType<DockerImageResponseDto[]>> {
    const images = await this.dockerImageService.listAll();
    const dtos = images.map(DockerImageResponseDto.fromDomain);
    return this.responseService.success(dtos);
  }

  @Post()
  @ApiOperation({
    summary: 'Register a new Docker image',
    description:
      'Registers a new Docker image and triggers a pull. Returns immediately with PULLING status.',
  })
  @ApiBody({ type: CreateDockerImageRequest })
  @ApiResponse({
    status: 201,
    description: 'Image registered and pull started',
    type: DockerImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or image already registered',
    type: ApiErrorResponseDto,
  })
  async create(
    @Body() request: CreateDockerImageRequest,
  ): Promise<ApiResponseType<DockerImageResponseDto>> {
    try {
      const image = await this.dockerImageService.registerAndPull(
        request.name,
        request.image,
      );
      const dto = DockerImageResponseDto.fromDomain(image);
      return this.responseService.success(dto, 201);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a Docker image',
    description: 'Removes a non-built-in image. Fails if it is the default.',
  })
  @ApiResponse({ status: 200, description: 'Image deleted' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete built-in or default image',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Image not found',
    type: ApiErrorResponseDto,
  })
  async delete(
    @Param('id') id: string,
  ): Promise<ApiResponseType<{ deleted: boolean }>> {
    try {
      await this.dockerImageService.deleteImage(id);
      return this.responseService.success({ deleted: true });
    } catch (error) {
      if (error.message === 'Image not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/default')
  @ApiOperation({
    summary: 'Set an image as the default',
    description:
      'Sets the specified image as default. Only available images can be set as default.',
  })
  @ApiResponse({
    status: 200,
    description: 'Default image updated',
    type: DockerImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Image not available',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Image not found',
    type: ApiErrorResponseDto,
  })
  async setDefault(
    @Param('id') id: string,
  ): Promise<ApiResponseType<DockerImageResponseDto>> {
    try {
      const image = await this.dockerImageService.setDefault(id);
      const dto = DockerImageResponseDto.fromDomain(image);
      return this.responseService.success(dto);
    } catch (error) {
      if (error.message === 'Image not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Get image pull status',
    description:
      'Poll the current status of an image (for tracking pull progress).',
  })
  @ApiResponse({
    status: 200,
    description: 'Image status',
    type: DockerImageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Image not found',
    type: ApiErrorResponseDto,
  })
  async getStatus(
    @Param('id') id: string,
  ): Promise<ApiResponseType<DockerImageResponseDto>> {
    const image = await this.dockerImageService.findById(id);
    if (!image) {
      throw new NotFoundException('Image not found');
    }
    const dto = DockerImageResponseDto.fromDomain(image);
    return this.responseService.success(dto);
  }

  @Post(':id/install')
  @ApiOperation({
    summary: 'Install a Docker image',
    description:
      'Triggers a pull for a NOT_PULLED image. Returns immediately with PULLING status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Install started',
    type: DockerImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Image is already installed or being pulled',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Image not found',
    type: ApiErrorResponseDto,
  })
  async install(
    @Param('id') id: string,
  ): Promise<ApiResponseType<DockerImageResponseDto>> {
    try {
      const image = await this.dockerImageService.installImage(id);
      const dto = DockerImageResponseDto.fromDomain(image);
      return this.responseService.success(dto);
    } catch (error) {
      if (error.message === 'Image not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post(':id/retry')
  @ApiOperation({
    summary: 'Retry pulling a failed image',
    description: 'Retries pulling an image that previously failed.',
  })
  @ApiResponse({
    status: 200,
    description: 'Pull retry started',
    type: DockerImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Image is already being pulled',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Image not found',
    type: ApiErrorResponseDto,
  })
  async retry(
    @Param('id') id: string,
  ): Promise<ApiResponseType<DockerImageResponseDto>> {
    try {
      const image = await this.dockerImageService.retryPull(id);
      const dto = DockerImageResponseDto.fromDomain(image);
      return this.responseService.success(dto);
    } catch (error) {
      if (error.message === 'Image not found') {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}
