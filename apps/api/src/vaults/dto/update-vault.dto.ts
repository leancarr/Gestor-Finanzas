import { IsOptional, IsString } from 'class-validator';

export class UpdateVaultDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'La descripción debe ser un texto' })
  description?: string;
}
