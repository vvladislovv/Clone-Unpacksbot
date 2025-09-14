import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'supersecret',
    });
  }

  async validate(payload: any) {
    console.log('🔍 JWT Strategy validate called with payload:', payload);
    try {
      const user = await this.authService.validateUser(payload.userId);
      console.log('✅ User found:', user ? 'Yes' : 'No');
      if (!user) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      console.error('❌ JWT Strategy validation error:', error.message);
      throw new UnauthorizedException();
    }
  }
}


