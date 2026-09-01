import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AuthUser, SupabaseJwtPayload } from '../auth.interface.js';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const jwtSecret =
      configService.get<string>('SUPABASE_JWT_SECRET') ||
      'dev-supabase-jwt-secret-placeholder-minimum-32-chars';

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: SupabaseJwtPayload): Promise<AuthUser> {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException(
        'Token de Supabase inválido o sin identificador de usuario (sub)',
      );
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      appMetadata: payload.app_metadata,
      userMetadata: payload.user_metadata,
    };
  }
}
