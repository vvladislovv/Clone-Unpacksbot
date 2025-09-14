import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Извлекаем информацию о пользователе из токена
    const user = (request as any).user;
    const userId = user?.userId || 'anonymous';
    const userRole = user?.role || 'unknown';

    this.logger.log(
      `🚀 ${method} ${url} - ${ip} - ${userAgent} - User: ${userId} (${userRole})`,
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          
          // Логируем успешный ответ
          this.logger.log(
            `✅ ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId}`,
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          
          // Логируем ошибку
          this.logger.error(
            `❌ ${method} ${url} - ${statusCode} - ${duration}ms - User: ${userId} - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}


