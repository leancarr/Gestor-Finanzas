import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { VaultRole, TransactionType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateVaultDto } from './dto/create-vault.dto.js';
import { UpdateVaultDto } from './dto/update-vault.dto.js';
import { AddMemberDto } from './dto/add-member.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';

export interface UserSummary {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
}

export interface MemberContribution {
  userId: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  totalPaid: number;
  percentage: number;
}

export interface DebtSettlement {
  fromUser: UserSummary;
  toUser: UserSummary;
  amount: number;
}

export interface VaultBalancesResult {
  vaultId: string;
  totalExpenses: number;
  fairSharePerMember: number;
  totalMembers: number;
  memberContributions: MemberContribution[];
  settlements: DebtSettlement[];
}

/**
 * Función pura para calcular balances, cuota equitativa y compensaciones de deudas.
 */
export function calculateVaultBalances(
  vaultId: string,
  members: Array<{ userId: string; user: UserSummary }>,
  expenses: Array<{ userId: string; amount: number | string | any }>,
): VaultBalancesResult {
  const totalMembers = members.length;
  const userPaidMap = new Map<string, number>();

  for (const m of members) {
    userPaidMap.set(m.userId, 0);
  }

  let totalExpenses = 0;
  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0;
    totalExpenses += amt;
    const current = userPaidMap.get(exp.userId) ?? 0;
    userPaidMap.set(exp.userId, current + amt);
  }

  totalExpenses = Math.round(totalExpenses * 100) / 100;
  const fairSharePerMember =
    totalMembers > 0 ? Math.round((totalExpenses / totalMembers) * 100) / 100 : 0;

  const memberContributions: MemberContribution[] = members.map((m) => {
    const totalPaid = Math.round((userPaidMap.get(m.userId) ?? 0) * 100) / 100;
    const percentage =
      totalExpenses > 0
        ? Math.round((totalPaid / totalExpenses) * 10000) / 100
        : 0;
    return {
      userId: m.userId,
      name: m.user.name,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      totalPaid,
      percentage,
    };
  });

  // Identificar deudores y acreedores
  interface BalanceParty {
    userId: string;
    name: string | null;
    email: string;
    avatarUrl: string | null;
    balance: number;
  }

  const debtors: BalanceParty[] = [];
  const creditors: BalanceParty[] = [];

  for (const mc of memberContributions) {
    const diff = Math.round((mc.totalPaid - fairSharePerMember) * 100) / 100;
    if (diff > 0.009) {
      creditors.push({
        userId: mc.userId,
        name: mc.name,
        email: mc.email,
        avatarUrl: mc.avatarUrl,
        balance: diff,
      });
    } else if (diff < -0.009) {
      debtors.push({
        userId: mc.userId,
        name: mc.name,
        email: mc.email,
        avatarUrl: mc.avatarUrl,
        balance: Math.abs(diff),
      });
    }
  }

  // Ordenar por balance descendente para saldar deudas de forma óptima
  debtors.sort((a, b) => b.balance - a.balance);
  creditors.sort((a, b) => b.balance - a.balance);

  const settlements: DebtSettlement[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount =
      Math.round(Math.min(debtor.balance, creditor.balance) * 100) / 100;

    if (settleAmount > 0) {
      settlements.push({
        fromUser: {
          id: debtor.userId,
          name: debtor.name,
          email: debtor.email,
          avatarUrl: debtor.avatarUrl,
        },
        toUser: {
          id: creditor.userId,
          name: creditor.name,
          email: creditor.email,
          avatarUrl: creditor.avatarUrl,
        },
        amount: settleAmount,
      });

      debtor.balance = Math.round((debtor.balance - settleAmount) * 100) / 100;
      creditor.balance =
        Math.round((creditor.balance - settleAmount) * 100) / 100;
    }

    if (debtor.balance <= 0.009) {
      dIdx++;
    }
    if (creditor.balance <= 0.009) {
      cIdx++;
    }
  }

  return {
    vaultId,
    totalExpenses,
    fairSharePerMember,
    totalMembers,
    memberContributions,
    settlements,
  };
}

@Injectable()
export class VaultsService {
  private readonly logger = new Logger(VaultsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea una nueva bóveda y asigna al creador como miembro con rol OWNER.
   */
  async create(userId: string, dto: CreateVaultDto) {
    return this.prisma.withUser(userId, async (tx) => {
      return tx.vault.create({
        data: {
          name: dto.name.trim(),
          description: dto.description ? dto.description.trim() : null,
          ownerId: userId,
          members: {
            create: {
              userId,
              role: VaultRole.OWNER,
            },
          },
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Busca todas las bóvedas donde el usuario sea propietario o miembro.
   */
  async findAll(userId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      return tx.vault.findMany({
        where: {
          OR: [
            { ownerId: userId },
            { members: { some: { userId } } },
          ],
        },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          _count: {
            select: {
              expenses: true,
              members: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  }

  /**
   * Obtiene los detalles de una bóveda específica verificando pertenencia del usuario.
   */
  async findOne(userId: string, vaultId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const vault = await tx.vault.findUnique({
        where: { id: vaultId },
        include: {
          owner: {
            select: {
              id: true,
              email: true,
              name: true,
              avatarUrl: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
            orderBy: { joinedAt: 'asc' },
          },
          _count: {
            select: {
              expenses: true,
              members: true,
            },
          },
        },
      });

      if (!vault) {
        throw new NotFoundException(`Bóveda con ID ${vaultId} no encontrada`);
      }

      const isMember =
        vault.ownerId === userId ||
        vault.members.some((m) => m.userId === userId);

      if (!isMember) {
        throw new ForbiddenException('No tienes acceso a esta bóveda');
      }

      return vault;
    });
  }

  /**
   * Actualiza el nombre o descripción de una bóveda. Requiere rol OWNER o ADMIN.
   */
  async update(userId: string, vaultId: string, dto: UpdateVaultDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const vault = await tx.vault.findUnique({
        where: { id: vaultId },
        include: {
          members: true,
        },
      });

      if (!vault) {
        throw new NotFoundException(`Bóveda con ID ${vaultId} no encontrada`);
      }

      const userMember = vault.members.find((m) => m.userId === userId);
      const isOwner =
        vault.ownerId === userId || userMember?.role === VaultRole.OWNER;
      const isAdmin = userMember?.role === VaultRole.ADMIN;

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'Solo el propietario o un administrador pueden editar la bóveda',
        );
      }

      return tx.vault.update({
        where: { id: vaultId },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description ? dto.description.trim() : null }
            : {}),
        },
        include: {
          owner: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Elimina una bóveda de forma definitiva. Solo el OWNER tiene autorización.
   */
  async delete(userId: string, vaultId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const vault = await tx.vault.findUnique({
        where: { id: vaultId },
        include: {
          members: true,
        },
      });

      if (!vault) {
        throw new NotFoundException(`Bóveda con ID ${vaultId} no encontrada`);
      }

      const userMember = vault.members.find((m) => m.userId === userId);
      const isOwner =
        vault.ownerId === userId || userMember?.role === VaultRole.OWNER;

      if (!isOwner) {
        throw new ForbiddenException(
          'Solo el propietario puede eliminar la bóveda',
        );
      }

      await tx.vault.delete({
        where: { id: vaultId },
      });

      this.logger.log(`Bóveda ${vaultId} eliminada por el usuario ${userId}`);

      return {
        message: 'Bóveda eliminada con éxito',
        deletedVaultId: vaultId,
      };
    });
  }

  /**
   * Agrega un nuevo miembro a la bóveda por email. Solo OWNER o ADMIN.
   */
  async addMember(userId: string, vaultId: string, dto: AddMemberDto) {
    return this.prisma.withUser(userId, async (tx) => {
      const vault = await tx.vault.findUnique({
        where: { id: vaultId },
        include: {
          members: true,
        },
      });

      if (!vault) {
        throw new NotFoundException(`Bóveda con ID ${vaultId} no encontrada`);
      }

      const userMember = vault.members.find((m) => m.userId === userId);
      const isOwner =
        vault.ownerId === userId || userMember?.role === VaultRole.OWNER;
      const isAdmin = userMember?.role === VaultRole.ADMIN;

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'Solo el propietario o un administrador pueden invitar miembros a la bóveda',
        );
      }

      const normalizedEmail = dto.email.trim().toLowerCase();
      const targetUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!targetUser) {
        throw new NotFoundException(
          `Usuario con email ${dto.email} no encontrado`,
        );
      }

      const alreadyMember = vault.members.some(
        (m) => m.userId === targetUser.id,
      );
      if (alreadyMember) {
        throw new BadRequestException(
          'El usuario ya es miembro de esta bóveda',
        );
      }

      return tx.vaultMember.create({
        data: {
          vaultId,
          userId: targetUser.id,
          role: dto.role ?? VaultRole.MEMBER,
        },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
      });
    });
  }

  /**
   * Remueve a un miembro de la bóveda o permite que un miembro la abandone.
   * El OWNER no puede ser removido.
   */
  async removeMember(userId: string, vaultId: string, memberUserId: string) {
    return this.prisma.withUser(userId, async (tx) => {
      const vault = await tx.vault.findUnique({
        where: { id: vaultId },
        include: {
          members: true,
        },
      });

      if (!vault) {
        throw new NotFoundException(`Bóveda con ID ${vaultId} no encontrada`);
      }

      const targetMember = vault.members.find((m) => m.userId === memberUserId);
      if (!targetMember) {
        throw new NotFoundException(
          `Miembro con ID ${memberUserId} no encontrado en la bóveda`,
        );
      }

      // El OWNER no puede ser removido
      if (
        vault.ownerId === memberUserId ||
        targetMember.role === VaultRole.OWNER
      ) {
        throw new BadRequestException(
          'El propietario no puede ser removido de la bóveda',
        );
      }

      const currentMember = vault.members.find((m) => m.userId === userId);
      const isSelf = userId === memberUserId;
      const isOwner =
        vault.ownerId === userId || currentMember?.role === VaultRole.OWNER;
      const isAdmin = currentMember?.role === VaultRole.ADMIN;

      if (!isSelf && !isOwner && !isAdmin) {
        throw new ForbiddenException(
          'No tienes permisos para remover miembros de esta bóveda',
        );
      }

      await tx.vaultMember.delete({
        where: {
          vaultId_userId: {
            vaultId,
            userId: memberUserId,
          },
        },
      });

      return {
        message: isSelf
          ? 'Has abandonado la bóveda con éxito'
          : 'Miembro removido con éxito',
        removedUserId: memberUserId,
        vaultId,
      };
    });
  }

  /**
   * Modifica el rol de un miembro. Solo OWNER o ADMIN. El OWNER no puede ser modificado.
   */
  async updateMemberRole(
    userId: string,
    vaultId: string,
    memberUserId: string,
    dto: UpdateMemberRoleDto,
  ) {
    return this.prisma.withUser(userId, async (tx) => {
      const vault = await tx.vault.findUnique({
        where: { id: vaultId },
        include: {
          members: true,
        },
      });

      if (!vault) {
        throw new NotFoundException(`Bóveda con ID ${vaultId} no encontrada`);
      }

      const targetMember = vault.members.find((m) => m.userId === memberUserId);
      if (!targetMember) {
        throw new NotFoundException(
          `Miembro con ID ${memberUserId} no encontrado en la bóveda`,
        );
      }

      if (
        vault.ownerId === memberUserId ||
        targetMember.role === VaultRole.OWNER
      ) {
        throw new BadRequestException(
          'No se puede modificar el rol del propietario',
        );
      }

      const currentMember = vault.members.find((m) => m.userId === userId);
      const isOwner =
        vault.ownerId === userId || currentMember?.role === VaultRole.OWNER;
      const isAdmin = currentMember?.role === VaultRole.ADMIN;

      if (!isOwner && !isAdmin) {
        throw new ForbiddenException(
          'Solo el propietario o administradores pueden modificar roles',
        );
      }

      return tx.vaultMember.update({
        where: {
          vaultId_userId: {
            vaultId,
            userId: memberUserId,
          },
        },
        data: {
          role: dto.role,
        },
        include: {
          user: {
            select: { id: true, email: true, name: true, avatarUrl: true },
          },
        },
      });
    });
  }

  /**
   * Calcula los balances de la bóveda: total de gastos, aportes individuales,
   * cuota justa por miembro y plan de compensación de deudas (settlements).
   */
  async getBalances(userId: string, vaultId: string): Promise<VaultBalancesResult> {
    return this.prisma.withUser(userId, async (tx) => {
      const vault = await tx.vault.findUnique({
        where: { id: vaultId },
        include: {
          members: {
            include: {
              user: {
                select: { id: true, email: true, name: true, avatarUrl: true },
              },
            },
          },
        },
      });

      if (!vault) {
        throw new NotFoundException(`Bóveda con ID ${vaultId} no encontrada`);
      }

      const isMember =
        vault.ownerId === userId ||
        vault.members.some((m) => m.userId === userId);

      if (!isMember) {
        throw new ForbiddenException('No tienes acceso a esta bóveda');
      }

      const expenses = await tx.expense.findMany({
        where: {
          vaultId,
          type: TransactionType.EXPENSE,
        },
        select: {
          amount: true,
          userId: true,
        },
      });

      return calculateVaultBalances(vaultId, vault.members, expenses);
    });
  }
}
