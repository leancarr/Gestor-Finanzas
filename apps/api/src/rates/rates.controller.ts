import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RatesService } from './rates.service.js';
import { ConvertRateDto } from './dto/convert-rate.dto.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('rates')
export class RatesController {
  constructor(private readonly ratesService: RatesService) {}

  /**
   * Obtiene las cotizaciones actuales de todas las divisas (Dólar, Euro, USDT, ARS).
   * Endpoint público con soporte de caché en memoria y fallback resiliente.
   */
  @Get()
  @Public()
  async getRates(@Query('refresh') refresh?: string) {
    const forceRefresh = refresh === 'true' || refresh === '1';
    return this.ratesService.getRates(forceRefresh);
  }

  /**
   * Realiza la conversión precisa entre dos monedas o criptoactivo vía POST.
   */
  @Post('convert')
  @Public()
  @HttpCode(HttpStatus.OK)
  async convert(@Body() convertRateDto: ConvertRateDto) {
    return this.ratesService.convert(
      convertRateDto.amount,
      convertRateDto.fromCurrency,
      convertRateDto.toCurrency,
      convertRateDto.rateType,
    );
  }

  /**
   * Realiza la conversión vía query parameters (GET) para facilitar consultas y widgets.
   */
  @Get('convert')
  @Public()
  async convertGet(@Query() query: ConvertRateDto) {
    return this.ratesService.convert(
      query.amount,
      query.fromCurrency,
      query.toCurrency,
      query.rateType,
    );
  }
}
