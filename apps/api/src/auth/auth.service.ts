import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from './auth.interface.js';

import { DEFAULT_CATEGORIES } from '../categories/categories.constants.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Sincroniza o busca el usuario autenticado en la base de datos de PostgreSQL (Prisma).
   * Si es un usuario nuevo o no tiene categorías, inserta las categorías por defecto.
   */
  async syncOrCreateUser(authUser: AuthUser) {
    if (!authUser || !authUser.id) {
      return null;
    }

    try {
      const email = authUser.email || `user_${authUser.id}@gestorguita.local`;
      const name =
        authUser.userMetadata?.name ||
        authUser.userMetadata?.full_name ||
        authUser.email?.split('@')[0] ||
        null;

      const user = await this.prisma.withUser(authUser.id, async (tx) => {
        const upsertedUser = await tx.user.upsert({
          where: { id: authUser.id },
          update: {
            email,
            ...(name ? { name } : {}),
          },
          create: {
            id: authUser.id,
            email,
            name,
          },
        });

        // Verificar si el usuario ya cuenta con categorías
        const categoryCount = await tx.category.count({
          where: { userId: authUser.id },
        });

        if (categoryCount === 0) {
          await tx.category.createMany({
            data: DEFAULT_CATEGORIES.map((cat) => ({
              name: cat.name,
              icon: cat.icon,
              color: cat.color,
              userId: authUser.id,
            })),
          });
          this.logger.log(
            `Categorías por defecto inicializadas para el usuario ${authUser.id}`,
          );
        }

        return upsertedUser;
      });

      return user;
    } catch (error) {
      this.logger.error(`Error sincronizando usuario ${authUser.id}:`, error);
      // Retornar información básica si la DB tiene alguna restricción temporal
      return {
        id: authUser.id,
        email: authUser.email,
        name: authUser.userMetadata?.name ?? null,
      };
    }
  }

  /**
   * Obtiene el estado de configuración del servicio de autenticación
   */
  getAuthStatus() {
    const hasJwtSecret = Boolean(this.configService.get('SUPABASE_JWT_SECRET'));
    const hasSupabaseUrl = Boolean(this.configService.get('SUPABASE_URL'));
    const hasAnonKey = Boolean(this.configService.get('SUPABASE_ANON_KEY'));

    return {
      strategy: 'supabase-jwt',
      configured: hasJwtSecret && hasSupabaseUrl,
      details: {
        hasJwtSecret,
        hasSupabaseUrl,
        hasAnonKey,
      },
    };
  }
}
