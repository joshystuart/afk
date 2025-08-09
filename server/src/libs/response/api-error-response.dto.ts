import { ApiProperty } from '@nestjs/swagger';

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({
    example: {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      timestamp: '2025-08-08T23:44:09.179Z'
    }
  })
  error: {
    message: string | string[];
    code: string;
    timestamp: string;
  };

  @ApiProperty({ example: 400 })
  statusCode: number;
}

export class ApiSuccessResponseDto<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: '2025-08-08T23:44:09.179Z' })
  timestamp: string;

  @ApiProperty({ example: 200 })
  statusCode: number;
}