import { Injectable, BadRequestException } from '@nestjs/common';
import {
  DEFAULT_TAX_DEFINITIONS,
  DEFAULT_TAX_RATE_MATRIX,
  TAX_NAMES,
  TaxBreakdownItem,
  TaxCalculationResult,
  TaxCurrency,
  TaxOperationType,
  TaxRateDefinition,
  TaxRateMatrix,
  TaxType,
} from './taxes.interface.js';
import { CalculateTaxDto } from './dto/calculate-tax.dto.js';

@Injectable()
export class TaxesService {
  private rateMatrix: TaxRateMatrix;

  constructor() {
    this.rateMatrix = this.cloneDefaultMatrix();
  }

  /**
   * Clona la matriz impositiva predeterminada para permitir mutaciones aisladas.
   */
  private cloneDefaultMatrix(): TaxRateMatrix {
    return JSON.parse(JSON.stringify(DEFAULT_TAX_RATE_MATRIX));
  }

  /**
   * Redondeo financiero exacto utilizando Number.EPSILON para evitar
   * problemas de representación en punto flotante IEEE 754.
   */
  round(value: number, decimals = 2): number {
    const factor = Math.pow(10, decimals);
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  /**
   * Obtiene la configuración de tasas impositivas configuradas.
   */
  getTaxRates(
    currency?: TaxCurrency,
    operationType?: TaxOperationType,
  ): TaxRateDefinition[] | Record<TaxOperationType, TaxRateDefinition[]> | TaxRateMatrix {
    if (currency && operationType) {
      return this.rateMatrix[currency]?.[operationType] ?? [];
    }
    if (currency) {
      return this.rateMatrix[currency];
    }
    return this.rateMatrix;
  }

  /**
   * Permite configurar o sobrescribir dinámicamente las tasas para una moneda y tipo de operación.
   */
  setTaxRates(
    currency: TaxCurrency,
    operationType: TaxOperationType,
    rates: TaxRateDefinition[],
  ): void {
    if (!this.rateMatrix[currency]) {
      throw new BadRequestException(`Moneda no soportada para configuración: ${currency}`);
    }
    this.rateMatrix[currency][operationType] = rates.map((r) => ({
      name: r.name,
      rate: r.rate > 1 && r.rate <= 100 ? this.round(r.rate / 100, 4) : r.rate,
      description: r.description,
    }));
  }

  /**
   * Restablece las tasas a los valores iniciales predeterminados.
   */
  resetTaxRates(): void {
    this.rateMatrix = this.cloneDefaultMatrix();
  }

  /**
   * Calcula el desglose impositivo y los importes totales según el monto, la moneda y el tipo de operación.
   */
  calculate(dto: CalculateTaxDto): TaxCalculationResult {
    const rawAmount = dto.amount ?? dto.baseAmount;

    if (rawAmount === undefined || rawAmount === null || isNaN(Number(rawAmount))) {
      throw new BadRequestException('El monto debe ser un valor numérico obligatorio');
    }

    const numAmount = Number(rawAmount);
    if (numAmount <= 0) {
      throw new BadRequestException('El monto base debe ser mayor a 0');
    }

    const decimals = dto.decimals !== undefined ? dto.decimals : 2;
    const baseAmount = this.round(numAmount, decimals);

    // Normalizar moneda
    const currencyStr = (dto.currency ?? TaxCurrency.ARS).toString().toUpperCase();
    if (!Object.values(TaxCurrency).includes(currencyStr as TaxCurrency)) {
      throw new BadRequestException(
        `Moneda no soportada: ${currencyStr}. Las monedas soportadas son ARS, USD, EUR, USDT`,
      );
    }
    const currency = currencyStr as TaxCurrency;

    let breakdown: TaxBreakdownItem[] = [];

    // 1. Caso: Tasas personalizadas explícitas (customRates o tipo CUSTOM)
    if (dto.customRates && dto.customRates.length > 0) {
      breakdown = dto.customRates.map((custom) => {
        const rate =
          custom.rate > 1 && custom.rate <= 100
            ? this.round(custom.rate / 100, 4)
            : custom.rate;
        const amount = this.round(baseAmount * rate, decimals);
        return {
          name: custom.name,
          rate,
          amount,
        };
      });
    }
    // 2. Caso: Selección explícita de taxTypes
    else if (dto.taxTypes && dto.taxTypes.length > 0) {
      if (dto.taxTypes.includes(TaxType.TAX_FREE)) {
        breakdown = [
          {
            name: TAX_NAMES.TAX_FREE,
            rate: 0,
            amount: 0,
          },
        ];
      } else {
        const items: TaxBreakdownItem[] = [];
        for (const taxType of dto.taxTypes) {
          if (taxType === TaxType.IVA) {
            const rate = DEFAULT_TAX_DEFINITIONS.IVA.rate;
            items.push({
              name: DEFAULT_TAX_DEFINITIONS.IVA.name,
              rate,
              amount: this.round(baseAmount * rate, decimals),
            });
          } else if (taxType === TaxType.PAIS) {
            const rate = DEFAULT_TAX_DEFINITIONS.PAIS.rate;
            items.push({
              name: DEFAULT_TAX_DEFINITIONS.PAIS.name,
              rate,
              amount: this.round(baseAmount * rate, decimals),
            });
          }
        }
        breakdown = items;
      }
    }
    // 3. Caso: Según tipo de operación y matriz de la moneda
    else {
      let operationType = dto.operationType;

      if (!operationType) {
        // Inferencia inteligente según moneda:
        // USDT por defecto no devenga impuestos locales
        operationType =
          currency === TaxCurrency.USDT
            ? TaxOperationType.TAX_FREE
            : TaxOperationType.STANDARD;
      }

      const configuredRates =
        this.rateMatrix[currency]?.[operationType] ??
        DEFAULT_TAX_RATE_MATRIX[currency]?.[operationType] ??
        [];

      breakdown = configuredRates.map((def) => {
        const amount = this.round(baseAmount * def.rate, decimals);
        return {
          name: def.name,
          rate: def.rate,
          amount,
        };
      });
    }

    const taxAmount = this.round(
      breakdown.reduce((sum, item) => sum + item.amount, 0),
      decimals,
    );

    const totalAmount = this.round(baseAmount + taxAmount, decimals);

    return {
      baseAmount,
      taxAmount,
      totalAmount,
      currency,
      breakdown,
    };
  }
}
