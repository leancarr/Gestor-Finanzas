import { IsEnum, IsNotEmpty } from 'class-validator';
import { VaultRole } from '@prisma/client';

export class UpdateMemberRoleDto {
  @IsNotEmpty({ message: 'El rol es obligatorio' })
  @IsEnum(VaultRole, { message: 'El rol debe ser OWNER, ADMIN, MEMBER o VIEWER' })
  role: VaultRole;
}
