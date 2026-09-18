import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TaxCurrency,
  TaxOperationType,
  TaxType,
} from '../taxes.interface.js';

export { TaxCurrency, TaxOperationType, TaxType };

export class CustomTaxRateDto {
  @IsNotEmpty({ message: 'El nombre del impuesto es obligatorio' })
  @IsString({ message: 'El nombre del impuesto debe ser una cadena de texto' })
  name!: string;

  @IsNotEmpty({ message: 'La tasa del impuesto es obligatoria' })
  @Type(() => Number)
  @IsNumber({}, { message: 'La tasa del impuesto debe ser un número válido' })
  @Min(0, { message: 'La tasa del impuesto no puede ser negativa' })
  rate!: number;
}

export class CalculateTaxDto {
  @ValidateIf((o) => o.baseAmount === undefined)
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'El monto debe ser un número válido con hasta 4 decimales' },
  )
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount?: number;

  @ValidateIf((o) => o.amount === undefined)
  @IsNotEmpty({ message: 'El monto base es obligatorio' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 4 },
    { message: 'El monto base debe ser un número válido con hasta 4 decimales' },
  )
  @IsPositive({ message: 'El monto base debe ser mayor a 0' })
  baseAmount?: number;

  @IsOptional()
  @IsEnum(TaxCurrency, {
    message: 'La moneda debe ser una de las soportadas: ARS, USD, EUR, USDT',
  })
  currency?: TaxCurrency = TaxCurrency.ARS;

  @IsOptional()
  @IsEnum(TaxOperationType, {
    message:
      'El tipo de operación debe ser STANDARD, INTERNATIONAL, TAX_FREE o CUSTOM',
  })
  operationType?: TaxOperationType;

  @IsOptional()
  @IsArray({ message: 'taxTypes debe ser un arreglo de tipos de impuestos' })
  @IsEnum(TaxType, {
    each: true,
    message: 'Cada tipo de impuesto debe ser IVA, PAIS o TAX_FREE',
  })
  taxTypes?: TaxType[];

  @IsOptional()
  @IsArray({ message: 'customRates debe ser un arreglo de tasas personalizadas' })
  @ValidateNested({ each: true })
  @Type(() => CustomTaxRateDto)
  customRates?: CustomTaxRateDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Los decimales deben ser un número válido' })
  @Min(0, { message: 'Los decimales no pueden ser negativos' })
  @Max(8, { message: 'Los decimales no pueden ser mayores a 8' })
  decimals?: number = 2;
}
