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
import { ExpensesService } from './expenses.service.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { QueryExpenseDto } from './dto/query-expense.dto.js';
import { SummaryExpenseDto } from './dto/summary-expense.dto.js';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthUser } from '../auth/auth.interface.js';
import { AiParseDto } from './dto/ai-parse.dto.js';

@Controller('expenses')
@UseGuards(SupabaseAuthGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  /**
   * Registra un nuevo gasto para el usuario autenticado.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: AuthUser,
    @Body() createExpenseDto: CreateExpenseDto,
  ) {
    return this.expensesService.create(user.id, createExpenseDto);
  }

  /**
   * Procesa texto con IA para extraer un gasto usando Structured Outputs.
   */
  @Post('ai-parse')
  @HttpCode(HttpStatus.OK)
  aiParse(
    @CurrentUser() user: AuthUser,
    @Body() aiParseDto: AiParseDto,
  ) {
    return this.expensesService.parseWithAI(user.id, aiParseDto.text);
  }

  /**
   * Obtiene el resumen mensual y por categorías de los gastos del usuario autenticado.
   */
  @Get('summary')
  getSummary(
    @CurrentUser() user: AuthUser,
    @Query() query: SummaryExpenseDto,
  ) {
    return this.expensesService.getSummary(user.id, query);
  }

  /**
   * Obtiene los gastos más recientes del usuario autenticado (por defecto 5).
   */
  @Get('recent')
  getRecent(
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
  ) {
    const take = limit ? Math.min(Math.max(Number(limit), 1), 50) : 5;
    return this.expensesService.getRecent(user.id, take);
  }

  /**
   * Obtiene todos los gastos del usuario autenticado con filtros opcionales.
   */
  @Get()
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: QueryExpenseDto,
  ) {
    return this.expensesService.findAll(user.id, query);
  }

  /**
   * Obtiene el detalle de un gasto específico por ID.
   */
  @Get(':id')
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.expensesService.findOne(user.id, id);
  }

  /**
   * Actualiza un gasto existente.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.id, id, updateExpenseDto);
  }

  /**
   * Elimina un gasto.
   */
  @Delete(':id')
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
  ) {
    return this.expensesService.remove(user.id, id);
  }
}
