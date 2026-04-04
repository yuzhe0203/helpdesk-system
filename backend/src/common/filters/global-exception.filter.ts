import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppLoggerService } from '../services/logger.service';

export interface ApiErrorResponse {
  code: string;
  message: string;
  data?: unknown;
  timestamp: string;
  path?: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(
    @Inject(AppLoggerService) private readonly logger: AppLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal Server Error';
    let data: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        const objResponse = exceptionResponse as Record<string, unknown>;
        message = (objResponse.message as string) || exception.message;
        data = objResponse.data;
      } else {
        message = exceptionResponse;
      }

      // Map HTTP status to custom error code
      code = this.mapStatusToCode(status);
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Unhandled Exception: ${exception.message}`,
        exception.stack,
        'GlobalExceptionFilter',
      );
    }

    const errorResponse: ApiErrorResponse = {
      code,
      message,
      data,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error (exclude 404s from error log)
    if (status !== HttpStatus.NOT_FOUND) {
      this.logger.error(
        `Exception: ${code} - ${message}`,
        exception instanceof Error ? exception.stack : undefined,
        `${request.method} ${request.url}`,
      );
    } else {
      this.logger.warn(`Not Found: ${request.method} ${request.url}`);
    }

    response.status(status).json(errorResponse);
  }

  private mapStatusToCode(status: number): string {
    const statusCodeMap: { [key: number]: string } = {
      [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
      [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
      [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
      [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
      [HttpStatus.CONFLICT]: 'CONFLICT',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
    };
    return statusCodeMap[status] || 'UNKNOWN_ERROR';
  }
}
