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
import { BudgetsService } from './budgets.service.js';
import { CreateBudgetDto } from './dto/create-budget.dto.js';
import { UpdateBudgetDto } from './dto/update-budget.dto.js';
import { QueryBudgetDto } from './dto/query-budget.dto.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.interface.js';

@Controller('budgets')
@UseGuards(SupabaseAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  /**
   * Obtiene la lista de presupuestos con cálculo cruzado de gastos para el período.
   */
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryBudgetDto,
  ) {
    return this.budgetsService.findAll(user.id, query);
  }

  /**
   * Obtiene el detalle de un presupuesto específico por ID.
   */
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.budgetsService.findOne(user.id, id);
  }

  /**
   * Crea o actualiza (upsert) un presupuesto para una categoría y mes/año.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body() createBudgetDto: CreateBudgetDto,
  ) {
    return this.budgetsService.create(user.id, createBudgetDto);
  }

  /**
   * Actualiza el monto o moneda de un presupuesto existente.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateBudgetDto: UpdateBudgetDto,
  ) {
    return this.budgetsService.update(user.id, id, updateBudgetDto);
  }

  /**
   * Elimina un presupuesto.
   */
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.budgetsService.remove(user.id, id);
  }
}
