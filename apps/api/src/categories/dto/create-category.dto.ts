import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty({ message: 'El nombre de la categoría es obligatorio' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El nombre no puede tener más de 50 caracteres' })
  name!: string;

  @IsOptional()
  @IsString({ message: 'El ícono debe ser una cadena de texto' })
  @MaxLength(50, { message: 'El ícono no puede tener más de 50 caracteres' })
  icon?: string;

  @IsOptional()
  @IsString({ message: 'El color debe ser una cadena de texto' })
  @MaxLength(20, { message: 'El color no puede tener más de 20 caracteres' })
  color?: string;
}
