import { Logger } from '@nestjs/common';

export function BusinessLogger(operation: string, entity?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const logger = new Logger(`Business-${entity || target.constructor.name}`);

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      // Извлекаем информацию о пользователе
      const request = args.find(arg => arg && typeof arg === 'object' && arg.user);
      const user = request?.user;
      const userId = user?.userId || 'anonymous';
      const userRole = user?.role || 'unknown';

      // Извлекаем ID сущности если есть
      const entityId = args.find(arg => typeof arg === 'string' && arg.length > 10) || 'unknown';

      logger.log(
        `🏢 ${operation}${entity ? ` on ${entity}` : ''} - User: ${userId} (${userRole}) - Entity: ${entityId}`,
      );

      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - startTime;
        
        logger.log(
          `✅ ${operation}${entity ? ` on ${entity}` : ''} - User: ${userId} - Success in ${duration}ms`,
        );
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        logger.error(
          `❌ ${operation}${entity ? ` on ${entity}` : ''} - User: ${userId} - Failed in ${duration}ms - Error: ${error.message}`,
        );
        
        throw error;
      }
    };
  };
}


