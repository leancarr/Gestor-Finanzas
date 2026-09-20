import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { GamificationService } from './gamification.service.js';
import { CreateChallengeDto } from './dto/create-challenge.dto.js';
import { UpdateChallengeDto } from './dto/update-challenge.dto.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.interface.js';

@Controller('gamification')
@UseGuards(SupabaseAuthGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  /**
   * Obtiene el panorama consolidado de gamificación (racha, retos y medallas).
   */
  @Get('overview')
  getOverview(@CurrentUser() user: AuthUser) {
    return this.gamificationService.getOverview(user.id);
  }

  /**
   * Obtiene la lista de todos los retos del usuario.
   */
  @Get('challenges')
  findAllChallenges(@CurrentUser() user: AuthUser) {
    return this.gamificationService.findAllChallenges(user.id);
  }

  /**
   * Crea un nuevo reto de ahorro.
   */
  @Post('challenges')
  @HttpCode(HttpStatus.CREATED)
  createChallenge(
    @CurrentUser() user: AuthUser,
    @Body() createChallengeDto: CreateChallengeDto,
  ) {
    return this.gamificationService.createChallenge(user.id, createChallengeDto);
  }

  /**
   * Registra el check-in diario para actualizar la racha de ahorro y evaluar retos.
   */
  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  checkInStreak(@CurrentUser() user: AuthUser) {
    return this.gamificationService.checkInStreak(user.id);
  }

  /**
   * Actualiza un reto existente.
   */
  @Patch('challenges/:id')
  updateChallenge(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateChallengeDto: UpdateChallengeDto,
  ) {
    return this.gamificationService.updateChallenge(user.id, id, updateChallengeDto);
  }

  /**
   * Elimina un reto.
   */
  @Delete('challenges/:id')
  removeChallenge(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.gamificationService.removeChallenge(user.id, id);
  }
}
