import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('RequestLogger');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('User-Agent') || '';
    const startTime = Date.now();

    // Логируем входящий запрос
    this.logger.log(
      `🌐 ${method} ${originalUrl} - ${ip} - ${userAgent}`,
    );

    // Перехватываем ответ для логирования времени выполнения
    const originalSend = res.send;
    res.send = function (body) {
      const duration = Date.now() - startTime;
      const statusCode = res.statusCode;
      
      // Логируем ответ
      if (statusCode >= 400) {
        Logger.prototype.error.call(
          this.logger,
          `❌ ${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
        );
      } else {
        Logger.prototype.log.call(
          this.logger,
          `✅ ${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
        );
      }

      return originalSend.call(this, body);
    }.bind(this);

    next();
  }
}


