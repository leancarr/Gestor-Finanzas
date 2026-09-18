import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.interface.js';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Obtiene los datos del perfil del usuario autenticado.
   * Devuelve { id, email, name, avatarUrl, createdAt }.
   */
  @Get('me')
  getProfile(@CurrentUser() user: AuthUser) {
    return this.usersService.getProfile(user.id);
  }

  /**
   * Actualiza el perfil del usuario autenticado.
   */
  @Patch('profile')
  updateProfile(
    @CurrentUser() user: AuthUser,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }

  /**
   * Borrado permanente de cuenta (GDPR Compliance).
   */
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@CurrentUser() user: AuthUser) {
    return this.usersService.deleteAccount(user.id);
  }
}
