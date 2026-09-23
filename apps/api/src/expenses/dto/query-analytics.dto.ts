import { IsOptional, IsIn, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export type AnalyticsRange = '7d' | '30d' | 'month';

export class QueryAnalyticsDto {
  @IsOptional()
  @IsUUID('all', { message: 'El ID de la bóveda debe ser un UUID válido' })
  vaultId?: string;

  @IsOptional()
  @IsIn(['7d', '30d', 'month'], {
    message: "El rango debe ser '7d', '30d' o 'month'",
  })
  range?: AnalyticsRange = '30d';

  @IsOptional()
  @IsString({ message: 'La moneda debe ser una cadena de texto' })
  @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
  currency?: string = 'ARS';
}
