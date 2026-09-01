import { IsOptional, IsString, IsISO8601, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryExpenseDto {
  @IsOptional()
  @IsString({ message: 'El ID de la categoría debe ser una cadena de texto' })
  categoryId?: string;

  @IsOptional()
  @IsString({ message: 'El término de búsqueda debe ser una cadena de texto' })
  search?: string;

  @IsOptional()
  @IsISO8601(
    { strict: false },
    { message: 'La fecha de inicio debe ser una fecha ISO8601 válida' },
  )
  startDate?: string;

  @IsOptional()
  @IsISO8601(
    { strict: false },
    { message: 'La fecha de fin debe ser una fecha ISO8601 válida' },
  )
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number;
}
