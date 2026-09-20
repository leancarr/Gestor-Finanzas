import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ChallengeStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateChallengeDto } from './dto/create-challenge.dto.js';
import { UpdateChallengeDto } from './dto/update-challenge.dto.js';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene el panorama consolidado de gamificación:
   * racha de ahorro actual, retos activos, retos completados y medallas obtenidas.
   */
  async getOverview(userId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: {
          savingStreak: true,
          lastStreakDate: true,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const challenges = await tx.challenge.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const activeChallenges = challenges.filter(
        (c) => c.status === ChallengeStatus.ACTIVE,
      );
      const completedChallenges = challenges.filter(
        (c) => c.status === ChallengeStatus.COMPLETED,
      );

      const badgesEarned = completedChallenges.map((c) => ({
        id: c.id,
        name: c.badgeName,
        icon: c.badgeIcon,
        unlockedAt: c.completedAt,
        challengeTitle: c.title,
      }));

      return {
        savingStreak: user.savingStreak || 0,
        lastStreakDate: user.lastStreakDate,
        activeChallenges,
        completedChallenges,
        badgesEarned,
      };
    });
  }

  /**
   * Crea un nuevo reto de ahorro para el usuario.
   */
  async createChallenge(userId: string, dto: CreateChallengeDto) {
    return this.prisma.withUser(userId, async (tx) => {
      if (dto.targetCategoryId) {
        const category = await tx.category.findFirst({
          where: {
            id: dto.targetCategoryId,
            userId,
          },
        });

        if (!category) {
          throw new NotFoundException(
            `Categoría con ID ${dto.targetCategoryId} no encontrada o no pertenece al usuario`,
          );
        }
      }

      return tx.challenge.create({
        data: {
          title: dto.title.trim(),
          description: dto.description ? dto.description.trim() : null,
          targetDays: dto.targetDays,
          badgeName: dto.badgeName ? dto.badgeName.trim() : 'Mano de hierro',
          badgeIcon: dto.badgeIcon ? dto.badgeIcon.trim() : 'Shield',
          targetCategoryId: dto.targetCategoryId || null,
          status: ChallengeStatus.ACTIVE,
          currentStreak: 0,
          bestStreak: 0,
          userId,
        },
      });
    });
  }

  /**
   * Registra el check-in diario de ahorro del usuario:
   * - Evalúa la racha general: si hoy ya hizo check-in, no duplica; si ayer fue el último día, incrementa en 1;
   *   si pasó más de 1 día (o es la primera vez), reinicia/inicia en 1.
   * - Evalúa los retos activos: si tiene categoría objetivo, verifica si hubo gastos en las últimas 24h.
   *   Si no hubo gastos, incrementa la racha del reto. Si alcanzó targetDays, marca COMPLETED y desbloquea medalla.
   */
  async checkInStreak(userId: string, referenceDate: Date = new Date()) {
    return this.prisma.withUser(userId, async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('Usuario no encontrado');
      }

      const todayUTC = new Date(
        Date.UTC(
          referenceDate.getUTCFullYear(),
          referenceDate.getUTCMonth(),
          referenceDate.getUTCDate(),
        ),
      );

      let alreadyCheckedInToday = false;
      let newStreak = 1;

      if (user.lastStreakDate) {
        const lastUTC = new Date(
          Date.UTC(
            user.lastStreakDate.getUTCFullYear(),
            user.lastStreakDate.getUTCMonth(),
            user.lastStreakDate.getUTCDate(),
          ),
        );

        const diffMs = todayUTC.getTime() - lastUTC.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
          alreadyCheckedInToday = true;
          newStreak = user.savingStreak || 0;
        } else if (diffDays === 1) {
          newStreak = (user.savingStreak || 0) + 1;
        } else {
          newStreak = 1;
        }
      }

      if (!alreadyCheckedInToday) {
        await tx.user.update({
          where: { id: userId },
          data: {
            savingStreak: newStreak,
            lastStreakDate: referenceDate,
          },
        });
      }

      // Evaluar retos activos
      const activeChallenges = await tx.challenge.findMany({
        where: {
          userId,
          status: ChallengeStatus.ACTIVE,
        },
      });

      const updatedChallenges = [];

      if (!alreadyCheckedInToday) {
        const since24h = new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000);

        for (const challenge of activeChallenges) {
          let success = true;

          if (challenge.targetCategoryId) {
            const expenseCount = await tx.expense.count({
              where: {
                userId,
                categoryId: challenge.targetCategoryId,
                type: TransactionType.EXPENSE,
                date: {
                  gte: since24h,
                  lte: referenceDate,
                },
              },
            });

            if (expenseCount > 0) {
              success = false;
            }
          }

          let newCurrentStreak: number;
          if (success) {
            newCurrentStreak = challenge.currentStreak + 1;
          } else {
            newCurrentStreak = 0;
          }

          const newBestStreak = Math.max(challenge.bestStreak, newCurrentStreak);
          const isCompleted = newCurrentStreak >= challenge.targetDays;

          const updated = await tx.challenge.update({
            where: { id: challenge.id },
            data: {
              currentStreak: newCurrentStreak,
              bestStreak: newBestStreak,
              status: isCompleted ? ChallengeStatus.COMPLETED : ChallengeStatus.ACTIVE,
              completedAt: isCompleted ? referenceDate : null,
            },
          });

          updatedChallenges.push(updated);
        }
      }

      return {
        alreadyCheckedInToday,
        savingStreak: newStreak,
        lastStreakDate: alreadyCheckedInToday ? user.lastStreakDate : referenceDate,
        evaluatedChallengesCount: updatedChallenges.length,
        updatedChallenges,
        message: alreadyCheckedInToday
          ? 'Ya has registrado tu actividad hoy'
          : 'Check-in registrado con éxito',
      };
    });
  }

  /**
   * Obtiene todos los retos del usuario.
   */
  async findAllChallenges(userId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      return tx.challenge.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  /**
   * Actualiza un reto existente.
   */
  async updateChallenge(userId: string, id: string, dto: UpdateChallengeDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.challenge.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new NotFoundException(`Reto con ID ${id} no encontrado`);
      }

      if (dto.targetCategoryId) {
        const category = await tx.category.findFirst({
          where: {
            id: dto.targetCategoryId,
            userId,
          },
        });

        if (!category) {
          throw new NotFoundException(
            `Categoría con ID ${dto.targetCategoryId} no encontrada o no pertenece al usuario`,
          );
        }
      }

      return tx.challenge.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description ? dto.description.trim() : null }
            : {}),
          ...(dto.targetDays !== undefined ? { targetDays: dto.targetDays } : {}),
          ...(dto.badgeName !== undefined ? { badgeName: dto.badgeName.trim() } : {}),
          ...(dto.badgeIcon !== undefined ? { badgeIcon: dto.badgeIcon.trim() } : {}),
          ...(dto.targetCategoryId !== undefined
            ? { targetCategoryId: dto.targetCategoryId || null }
            : {}),
        },
      });
    });
  }

  /**
   * Elimina un reto.
   */
  async removeChallenge(userId: string, id: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const existing = await tx.challenge.findFirst({
        where: { id, userId },
      });

      if (!existing) {
        throw new NotFoundException(`Reto con ID ${id} no encontrado`);
      }

      await tx.challenge.delete({
        where: { id },
      });

      return {
        message: 'Reto eliminado con éxito',
        id,
      };
    });
  }
}
