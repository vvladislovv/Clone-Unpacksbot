import { Logger } from '@nestjs/common';

export function ActionLogger(action: string, context?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = new Logger(context || target.constructor.name);

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      // Извлекаем информацию о пользователе из контекста
      const request = args.find(arg => arg && typeof arg === 'object' && arg.user);
      const user = request?.user;
      const userId = user?.userId || 'anonymous';
      const userRole = user?.role || 'unknown';

      logger.log(
        `🎯 ${action} - User: ${userId} (${userRole}) - Started`,
      );

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        logger.log(
          `✅ ${action} - User: ${userId} - Completed in ${duration}ms`,
        );
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error(
          `❌ ${action} - User: ${userId} - Failed in ${duration}ms - Error: ${error.message}`,
        );
        
        throw error;
      }
    };
  };
}


