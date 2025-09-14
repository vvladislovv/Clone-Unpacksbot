import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    console.log('🚀 JWT Guard canActivate called');
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('🔍 JWT Guard canActivate called, isPublic:', isPublic);
    console.log('🔍 Handler metadata:', this.reflector.get(IS_PUBLIC_KEY, context.getHandler()));
    console.log('🔍 Class metadata:', this.reflector.get(IS_PUBLIC_KEY, context.getClass()));
    if (isPublic) {
      console.log('✅ Route is public, allowing access');
      return true;
    }
    console.log('🔐 Route is protected, checking authentication');
    return super.canActivate(context);
  }
}


