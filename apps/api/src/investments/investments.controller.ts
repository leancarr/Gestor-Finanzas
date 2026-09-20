import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service.js';
import { CreateAssetDto } from './dto/create-asset.dto.js';
import { UpdateAssetDto } from './dto/update-asset.dto.js';
import { QueryAssetDto } from './dto/query-asset.dto.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.interface.js';

@Controller('investments')
@UseGuards(SupabaseAuthGuard)
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  /**
   * Crea un nuevo activo en el portafolio del usuario.
   */
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() createAssetDto: CreateAssetDto) {
    return this.investmentsService.create(user.id, createAssetDto);
  }

  /**
   * Lista todos los activos del usuario, con filtro opcional por tipo.
   */
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() query: QueryAssetDto) {
    return this.investmentsService.findAll(user.id, query.type);
  }

  /**
   * Obtiene el resumen financiero consolidado del portafolio (Net Worth, P&L, Distribución y Tasas).
   * Definido antes de ':id' para evitar conflicto de rutas dinámicas.
   */
  @Get('summary')
  getPortfolioSummary(@CurrentUser() user: AuthUser) {
    return this.investmentsService.getPortfolioSummary(user.id);
  }

  /**
   * Obtiene un activo específico por su ID.
   */
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.investmentsService.findOne(user.id, id);
  }

  /**
   * Actualiza los datos de un activo específico.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
  ) {
    return this.investmentsService.update(user.id, id, updateAssetDto);
  }

  /**
   * Elimina un activo del portafolio.
   */
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.investmentsService.remove(user.id, id);
  }
}
