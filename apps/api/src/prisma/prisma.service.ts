import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

export type DatabaseRole = 'authenticated' | 'anon' | 'service_role';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Ejecuta una transacción Prisma bajo el contexto seguro del usuario autenticado (RLS).
   * Setea la variable local de sesión Postgres (SET LOCAL) para request.jwt.claim.sub y app.current_user_id.
   *
   * @param userId Identificador único del usuario autenticado
   * @param callback Función de consulta que recibe el cliente transaccional seguro
   */
  async withUser<T>(
    userId: string,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      // 1. Establece el rol de conexión a 'authenticated' (sujeto a RLS)
      await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated;`);

      // 2. Inyecta la identidad del usuario para auth.uid() en Postgres
      await tx.$executeRaw`SELECT set_config('request.jwt.claim.sub', ${userId}, true), set_config('app.current_user_id', ${userId}, true)`;

      // 3. Ejecuta la consulta protegida por RLS
      return callback(tx);
    });
  }

  /**
   * Ejecuta una transacción Prisma bajo un rol específico (authenticated, anon o service_role)
   *
   * @param role Rol de Postgres
   * @param userId ID de usuario opcional
   * @param callback Función transaccional
   */
  async withRole<T>(
    role: DatabaseRole,
    userId: string | null | undefined,
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE ${role};`);
      if (userId) {
        await tx.$executeRaw`SELECT set_config('request.jwt.claim.sub', ${userId}, true), set_config('app.current_user_id', ${userId}, true)`;
      }
      return callback(tx);
    });
  }

  /**
   * Helper conveniente para ejecutar consultas seguras con objeto de usuario o ID string
   */
  async forUser<T>(
    userOrId: string | { id: string },
    callback: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const userId = typeof userOrId === 'string' ? userOrId : userOrId.id;
    return this.withUser(userId, callback);
  }
}
