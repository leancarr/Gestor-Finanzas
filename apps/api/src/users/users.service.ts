import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el perfil del usuario autenticado bajo contexto RLS.
   * Devuelve { id, email, name, avatarUrl, createdAt }
   */
  async getProfile(userId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
        },
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      return user;
    });
  }

  /**
   * Actualiza el perfil del usuario autenticado bajo contexto RLS.
   */
  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      return tx.user.update({
        where: { id: userId },
        data: {
          ...(updateProfileDto.name !== undefined
            ? { name: updateProfileDto.name.trim() }
            : {}),
          ...(updateProfileDto.avatarUrl !== undefined
            ? { avatarUrl: updateProfileDto.avatarUrl.trim() || null }
            : {}),
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
          createdAt: true,
        },
      });
    });
  }

  /**
   * Borrado permanente de cuenta y datos personales (GDPR Compliance).
   * En una transacción RLS con prisma.withUser(userId), elimina en cascada:
   * 1. Gastos (tx.expense.deleteMany({ where: { userId } }))
   * 2. Categorías (tx.category.deleteMany({ where: { userId } }))
   * 3. Registro de usuario (tx.user.delete({ where: { id: userId } }))
   */
  async deleteAccount(userId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
      }

      // 1. Eliminar los gastos del usuario
      await tx.expense.deleteMany({
        where: { userId },
      });

      // 2. Eliminar las categorías del usuario
      await tx.category.deleteMany({
        where: { userId },
      });

      // 3. Eliminar el registro del usuario
      await tx.user.delete({
        where: { id: userId },
      });

      this.logger.log(
        `Usuario ${userId} y todos sus datos han sido eliminados de forma permanente (GDPR).`,
      );

      return {
        message: 'Cuenta y datos eliminados permanentemente (GDPR compliant)',
        deletedUserId: userId,
      };
    });
  }
}
