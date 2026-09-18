import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard.js';
import { TaxesService } from './taxes.service.js';
import { CalculateTaxDto } from './dto/calculate-tax.dto.js';
import type {
  TaxCalculationResult,
  TaxCurrency,
  TaxOperationType,
} from './taxes.interface.js';

@Controller('taxes')
@UseGuards(SupabaseAuthGuard)
export class TaxesController {
  constructor(private readonly taxesService: TaxesService) {}

  /**
   * Endpoint protegido para cálculo de impuestos multimoneda.
   */
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  calculate(@Body() calculateTaxDto: CalculateTaxDto): TaxCalculationResult {
    return this.taxesService.calculate(calculateTaxDto);
  }

  /**
   * Endpoint de consulta de tasas impositivas configuradas por moneda y tipo de operación.
   */
  @Get('rates')
  getRates(
    @Query('currency') currency?: TaxCurrency,
    @Query('operationType') operationType?: TaxOperationType,
  ) {
    return this.taxesService.getTaxRates(currency, operationType);
  }
}
