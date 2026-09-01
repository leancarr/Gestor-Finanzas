import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import type { AuthUser } from './auth.interface.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Endpoint protegido: Devuelve el perfil y claims del usuario autenticado
   */
  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getProfile(@CurrentUser() user: AuthUser) {
    const dbUser = await this.authService.syncOrCreateUser(user);

    return {
      authenticated: true,
      user,
      profile: dbUser,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Endpoint público: Estado de la configuración de Supabase Auth en el backend
   */
  @Get('status')
  @Public()
  getStatus() {
    return {
      status: 'ok',
      auth: this.authService.getAuthStatus(),
      timestamp: new Date().toISOString(),
    };
  }
}
