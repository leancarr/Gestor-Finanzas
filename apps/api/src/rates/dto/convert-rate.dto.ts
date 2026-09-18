import { IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ConvertRateDto {
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @Type(() => Number)
  @IsNumber({}, { message: 'El monto debe ser un número válido' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount!: number;

  @Transform(({ obj, value }) => (value ?? obj?.from ?? '').toString().trim().toUpperCase())
  @IsNotEmpty({ message: 'La divisa de origen (fromCurrency) es obligatoria' })
  @IsString({ message: 'La divisa de origen debe ser un texto' })
  fromCurrency!: string;

  @Transform(({ obj, value }) => (value ?? obj?.to ?? '').toString().trim().toUpperCase())
  @IsNotEmpty({ message: 'La divisa de destino (toCurrency) es obligatoria' })
  @IsString({ message: 'La divisa de destino debe ser un texto' })
  toCurrency!: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsString({ message: 'El tipo de cotización debe ser un texto' })
  rateType?: string;
}
