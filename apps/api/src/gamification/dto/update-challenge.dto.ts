import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateChallengeDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El título no puede exceder 100 caracteres' })
  title?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  @MaxLength(255, { message: 'La descripción no puede exceder 255 caracteres' })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Los días objetivo deben ser un número entero' })
  @Min(1, { message: 'Los días objetivo deben ser al menos 1' })
  targetDays?: number;

  @IsOptional()
  @IsString({ message: 'El nombre de la medalla debe ser una cadena de texto' })
  @MaxLength(100, { message: 'El nombre de la medalla no puede exceder 100 caracteres' })
  badgeName?: string;

  @IsOptional()
  @IsString({ message: 'El ícono de la medalla debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El ícono de la medalla no puede exceder 50 caracteres' })
  badgeIcon?: string;

  @IsOptional()
  @IsString({ message: 'El ID de la categoría objetivo debe ser una cadena de texto' })
  @IsUUID('all', { message: 'El ID de la categoría objetivo debe ser un UUID válido' })
  targetCategoryId?: string | null;
}
