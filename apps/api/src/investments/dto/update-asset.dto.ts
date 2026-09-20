import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssetType } from '@prisma/client';

export class UpdateAssetDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  name?: string;

  @IsOptional()
  @IsEnum(AssetType, {
    message: 'El tipo de activo debe ser CASH_ARS, CASH_USD, FIXED_TERM, CEDEAR, CRYPTO u OTHER',
  })
  type?: AssetType;

  @IsOptional()
  @IsString({ message: 'El ticker debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El ticker no puede tener más de 20 caracteres' })
  ticker?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La cantidad debe ser un número válido' })
  @IsPositive({ message: 'La cantidad debe ser mayor a 0' })
  quantity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio de compra debe ser un número válido' })
  @Min(0, { message: 'El precio de compra no puede ser negativo' })
  purchasePrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El precio actual debe ser un número válido' })
  @Min(0, { message: 'El precio actual no puede ser negativo' })
  currentPrice?: number;

  @IsOptional()
  @IsString({ message: 'La divisa debe ser una cadena de texto' })
  @MaxLength(10, { message: 'La divisa no puede tener más de 10 caracteres' })
  currency?: string;

  @IsOptional()
  @IsString({ message: 'La entidad o institución debe ser una cadena de texto' })
  @MaxLength(100, { message: 'La entidad no puede tener más de 100 caracteres' })
  institution?: string;

  @IsOptional()
  @IsISO8601(
    { strict: false },
    { message: 'La fecha de vencimiento debe tener un formato ISO8601 válido (ej: YYYY-MM-DD)' },
  )
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'La tasa de interés debe ser un número válido' })
  @Min(0, { message: 'La tasa de interés no puede ser negativa' })
  interestRate?: number;

  @IsOptional()
  @IsString({ message: 'Las notas deben ser una cadena de texto' })
  @MaxLength(500, { message: 'Las notas no pueden superar los 500 caracteres' })
  notes?: string;
}
