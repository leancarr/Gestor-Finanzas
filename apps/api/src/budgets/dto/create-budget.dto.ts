import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsPositive,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @IsNotEmpty({ message: 'El ID de la categoría es obligatorio' })
  @IsString({ message: 'El ID de la categoría debe ser un texto' })
  categoryId: string;

  @IsNotEmpty({ message: 'El monto presupuestado es obligatorio' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un valor numérico' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount: number;

  @IsNotEmpty({ message: 'El mes es obligatorio' })
  @Type(() => Number)
  @IsInt({ message: 'El mes debe ser un número entero' })
  @Min(1, { message: 'El mes debe estar entre 1 y 12' })
  @Max(12, { message: 'El mes debe estar entre 1 y 12' })
  month: number;

  @IsNotEmpty({ message: 'El año es obligatorio' })
  @Type(() => Number)
  @IsInt({ message: 'El año debe ser un número entero' })
  @Min(2000, { message: 'El año debe ser mayor o igual a 2000' })
  @Max(2100, { message: 'El año no puede ser superior a 2100' })
  year: number;

  @IsOptional()
  @IsString({ message: 'La moneda debe ser un texto (ej: ARS, USD)' })
  currency?: string;
}
