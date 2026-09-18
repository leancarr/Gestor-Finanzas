import { IsNumber, IsPositive, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBudgetDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un valor numérico' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount?: number;

  @IsOptional()
  @IsString({ message: 'La moneda debe ser un texto (ej: ARS, USD)' })
  currency?: string;
}
