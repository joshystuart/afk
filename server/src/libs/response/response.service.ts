import { Injectable } from '@nestjs/common';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  statusCode: number;
}

export interface ApiErrorResponse {
  success: boolean;
  error: {
    message: string;
    code: string;
    timestamp: string;
  };
  statusCode: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

@Injectable()
export class ResponseService {
  success<T>(data: T, statusCode: number = 200): ApiResponse<T> {
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      statusCode,
    };
  }

  error(message: string, code?: string, statusCode: number = 400): ApiErrorResponse {
    return {
      success: false,
      error: {
        message,
        code: code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
      },
      statusCode,
    };
  }

  paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
  ): PaginatedResponse<T> {
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
      statusCode: 200,
    };
  }
}