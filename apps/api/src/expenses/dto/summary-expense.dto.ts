import { IsOptional, IsInt, Min, Max, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class SummaryExpenseDto {
  @IsOptional()
  @IsUUID('all', { message: 'El ID de la bóveda debe ser un UUID válido' })
  vaultId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El mes debe ser un número entero entre 1 y 12' })
  @Min(1, { message: 'El mes mínimo es 1' })
  @Max(12, { message: 'El mes máximo es 12' })
  month?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El año debe ser un número entero válido' })
  @Min(2000, { message: 'El año mínimo es 2000' })
  @Max(2100, { message: 'El año máximo es 2100' })
  year?: number;

  @IsOptional()
  @IsString({ message: 'La divisa debe ser una cadena de texto' })
  currency?: string;
}
