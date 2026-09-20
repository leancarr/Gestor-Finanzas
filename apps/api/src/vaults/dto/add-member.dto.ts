import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { VaultRole } from '@prisma/client';

export class AddMemberDto {
  @IsNotEmpty({ message: 'El email del usuario es obligatorio' })
  @IsEmail({}, { message: 'El formato del email es inválido' })
  email: string;

  @IsOptional()
  @IsEnum(VaultRole, { message: 'El rol debe ser OWNER, ADMIN, MEMBER o VIEWER' })
  role?: VaultRole = VaultRole.MEMBER;
}
