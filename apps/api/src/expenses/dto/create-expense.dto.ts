import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  IsISO8601,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '@prisma/client';

export class CreateExpenseDto {
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe ser un número válido con hasta 2 decimales' },
  )
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount!: number;

  @IsOptional()
  @IsEnum(TransactionType, { message: 'El tipo debe ser EXPENSE o INCOME' })
  type?: TransactionType;

  @IsNotEmpty({ message: 'La descripción es obligatoria' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La descripción no puede tener más de 255 caracteres' })
  description!: string;

  @IsOptional()
  @IsISO8601(
    { strict: false },
    { message: 'La fecha debe tener un formato ISO8601 válido (ej: YYYY-MM-DD)' },
  )
  date?: string;

  @IsOptional()
  @IsString({ message: 'El ID de la categoría debe ser una cadena de texto' })
  @IsUUID('all', { message: 'El ID de la categoría debe ser un UUID válido' })
  categoryId?: string;

  @IsOptional()
  @IsString({ message: 'La divisa debe ser una cadena de texto' })
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El tipo de cambio debe ser un número válido' })
  @IsPositive({ message: 'El tipo de cambio debe ser mayor a 0' })
  exchangeRate?: number;

  @IsOptional()
  isTaxable?: boolean;

  @IsOptional()
  @IsArray({ message: 'Las etiquetas deben ser una lista de textos' })
  @IsString({ each: true, message: 'Cada etiqueta debe ser una cadena de texto' })
  tags?: string[];
}
