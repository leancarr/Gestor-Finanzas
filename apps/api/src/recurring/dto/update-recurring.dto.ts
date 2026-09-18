import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType, RecurrenceFrequency } from '@prisma/client';

export class UpdateRecurringDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre no puede tener más de 100 caracteres' })
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'El monto debe ser un número válido con hasta 2 decimales' },
  )
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount?: number;

  @IsOptional()
  @IsString({ message: 'La divisa debe ser una cadena de texto' })
  currency?: string;

  @IsOptional()
  @IsEnum(TransactionType, { message: 'El tipo debe ser EXPENSE o INCOME' })
  type?: TransactionType;

  @IsOptional()
  @IsEnum(RecurrenceFrequency, {
    message: 'La frecuencia debe ser DAILY, WEEKLY, MONTHLY o YEARLY',
  })
  frequency?: RecurrenceFrequency;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El día del mes debe ser un número entero' })
  @Min(1, { message: 'El día del mes debe ser al menos 1' })
  @Max(31, { message: 'El día del mes no puede ser mayor a 31' })
  dayOfMonth?: number;

  @IsOptional()
  @IsISO8601(
    { strict: false },
    { message: 'La fecha de próximo vencimiento debe tener un formato ISO8601 válido (ej: YYYY-MM-DD)' },
  )
  nextDueDate?: string;

  @IsOptional()
  @IsBoolean({ message: 'El débito automático debe ser un valor booleano' })
  autoDebit?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser un valor booleano' })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: 'El ID de categoría debe ser una cadena de texto' })
  @IsUUID('all', { message: 'El ID de la categoría debe ser un UUID válido' })
  categoryId?: string;
}
