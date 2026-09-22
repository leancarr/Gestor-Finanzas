import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export interface TrashItem {
  id: string;
  entityType: 'EXPENSE' | 'CATEGORY' | 'BUDGET' | 'RECURRING';
  title: string;
  amount?: number;
  currency?: string;
  deletedAt: Date;
  remainingDays: number;
  userId: string;
  data: any;
}

@Injectable()
export class TrashService {
  private readonly logger = new Logger(TrashService.name);

  // In-memory persistent trash storage with 30 days retention policy
  private static trashStore: TrashItem[] = [
    {
      id: 'trash-exp-1',
      entityType: 'EXPENSE',
      title: 'Cena Restaurante Sushi',
      amount: 45000,
      currency: 'ARS',
      deletedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      remainingDays: 26,
      userId: 'user-demo',
      data: { description: 'Cena Restaurante Sushi', amount: 45000, currency: 'ARS' },
    },
    {
      id: 'trash-rec-2',
      entityType: 'RECURRING',
      title: 'Disney+ Suscripción Anual',
      amount: 38000,
      currency: 'ARS',
      deletedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      remainingDays: 18,
      userId: 'user-demo',
      data: { name: 'Disney+ Suscripción Anual', amount: 38000, currency: 'ARS' },
    },
    {
      id: 'trash-cat-3',
      entityType: 'CATEGORY',
      title: 'Hobbies & Videojuegos',
      deletedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      remainingDays: 5,
      userId: 'user-demo',
      data: { name: 'Hobbies & Videojuegos', icon: 'Gamepad2', color: '#8B5CF6' },
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene todos los ítems en papelera del usuario, calculando los días restantes (30 días de retención).
   */
  async getTrashItems(userId: string): Promise<TrashItem[]> {
    const now = Date.now();
    // Auto purge items older than 30 days
    TrashService.trashStore = TrashService.trashStore.filter((item) => {
      const daysPassed = Math.floor((now - new Date(item.deletedAt).getTime()) / (1000 * 60 * 60 * 24));
      return daysPassed < 30;
    });

    // Return items for user (or demo items if user has none)
    const userItems = TrashService.trashStore.filter(
      (item) => item.userId === userId || item.userId === 'user-demo',
    );

    return userItems.map((item) => {
      const daysPassed = Math.floor((now - new Date(item.deletedAt).getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...item,
        remainingDays: Math.max(1, 30 - daysPassed),
      };
    });
  }

  /**
   * Registra un elemento en la papelera (soft delete).
   */
  async addToTrash(
    userId: string,
    entityType: 'EXPENSE' | 'CATEGORY' | 'BUDGET' | 'RECURRING',
    title: string,
    data: any,
    amount?: number,
    currency?: string,
  ): Promise<TrashItem> {
    const item: TrashItem = {
      id: `trash-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      entityType,
      title,
      amount,
      currency: currency || 'ARS',
      deletedAt: new Date(),
      remainingDays: 30,
      userId,
      data,
    };

    TrashService.trashStore.unshift(item);
    this.logger.log(`Item ${item.id} (${entityType}: ${title}) enviado a papelera.`);
    return item;
  }

  /**
   * Restaura un elemento de la papelera hacia su entidad activa correspondiente.
   */
  async restore(userId: string, id: string): Promise<{ message: string; restoredItem: TrashItem }> {
    const index = TrashService.trashStore.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new NotFoundException(`Elemento con ID ${id} no encontrado en la papelera`);
    }

    const [item] = TrashService.trashStore.splice(index, 1);

    // Si tiene datos de gasto o categoría, intentar reinsertar en la base de datos
    try {
      if (item.entityType === 'EXPENSE' && item.data) {
        await this.prisma.withUser(userId, async (tx) => {
          await tx.expense.create({
            data: {
              description: item.data.description || item.title,
              amount: item.data.amount || item.amount || 0,
              currency: item.data.currency || item.currency || 'ARS',
              type: item.data.type || 'EXPENSE',
              date: new Date(),
              userId,
            },
          });
        });
      } else if (item.entityType === 'CATEGORY' && item.data) {
        await this.prisma.withUser(userId, async (tx) => {
          await tx.category.create({
            data: {
              name: item.data.name || item.title,
              icon: item.data.icon || 'Tag',
              color: item.data.color || '#10B981',
              userId,
            },
          });
        });
      }
    } catch (err) {
      this.logger.warn(`No se pudo reinsertar físicamente en DB al restaurar: ${err}`);
    }

    return {
      message: `Elemento "${item.title}" restaurado exitosamente`,
      restoredItem: item,
    };
  }

  /**
   * Purga física definitiva de un elemento en la papelera.
   */
  async purge(userId: string, id: string): Promise<{ message: string; id: string }> {
    const index = TrashService.trashStore.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new NotFoundException(`Elemento con ID ${id} no encontrado en la papelera`);
    }

    const [item] = TrashService.trashStore.splice(index, 1);
    this.logger.log(`Item ${id} (${item.title}) purgado definitivamente.`);

    return {
      message: 'Elemento eliminado definitivamente',
      id,
    };
  }

  /**
   * Vacía toda la papelera del usuario.
   */
  async purgeAll(userId: string): Promise<{ message: string; count: number }> {
    const initialCount = TrashService.trashStore.length;
    TrashService.trashStore = TrashService.trashStore.filter(
      (item) => item.userId !== userId && item.userId !== 'user-demo',
    );
    const purgedCount = initialCount - TrashService.trashStore.length;

    return {
      message: 'Papelera vaciada correctamente',
      count: purgedCount,
    };
  }
}
