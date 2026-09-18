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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecurringService } from './recurring.service.js';
import { CreateRecurringDto } from './dto/create-recurring.dto.js';
import { UpdateRecurringDto } from './dto/update-recurring.dto.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.interface.js';

@Controller('recurring')
@UseGuards(SupabaseAuthGuard)
export class RecurringController {
  constructor(private readonly recurringService: RecurringService) {}

  /**
   * Obtiene la lista de transacciones recurrentes del usuario ordenadas por vencimiento ascendente.
   * Por defecto devuelve solo las activas, o todas si se especifica ?all=true.
   */
  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query('all') all?: string) {
    const onlyActive = all !== 'true';
    return this.recurringService.findAll(user.id, onlyActive);
  }

  /**
   * Procesa en lote todos los débitos automáticos vencidos hasta la fecha actual.
   * IMPORTANTE: Definido antes de ':id' para evitar colisión de rutas.
   */
  @Post('process-due')
  @HttpCode(HttpStatus.OK)
  processDue(@CurrentUser() user: AuthUser) {
    return this.recurringService.processDue(user.id);
  }

  /**
   * Obtiene una transacción recurrente específica por su ID.
   */
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.recurringService.findOne(user.id, id);
  }

  /**
   * Crea una nueva suscripción o gasto recurrente.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body() createRecurringDto: CreateRecurringDto,
  ) {
    return this.recurringService.create(user.id, createRecurringDto);
  }

  /**
   * Actualiza datos o alterna el estado activo de una recurrencia.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateRecurringDto: UpdateRecurringDto,
  ) {
    return this.recurringService.update(user.id, id, updateRecurringDto);
  }

  /**
   * Elimina una transacción recurrente.
   */
  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.recurringService.remove(user.id, id);
  }

  /**
   * Genera inmediatamente el gasto correspondiente al vencimiento actual y avanza la fecha.
   */
  @Post(':id/process')
  @HttpCode(HttpStatus.OK)
  process(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.recurringService.process(user.id, id);
  }
}
