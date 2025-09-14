import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    console.log('🚀 JWT Guard canActivate called');
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('🔍 JWT Guard canActivate called, isPublic:', isPublic);
    if (isPublic) {
      console.log('✅ Route is public, allowing access');
      return true;
    }
    console.log('🔐 Route is protected, checking authentication');
    try {
      const result = super.canActivate(context);
      console.log('🔐 JWT Guard result:', result);
      return result;
    } catch (error) {
      console.error('❌ JWT Guard error:', error);
      return false;
    }
  }
}


