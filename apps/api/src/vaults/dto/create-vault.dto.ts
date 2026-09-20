import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateVaultDto {
  @IsNotEmpty({ message: 'El nombre de la bóveda es obligatorio' })
  @IsString({ message: 'El nombre debe ser un texto' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;
}
