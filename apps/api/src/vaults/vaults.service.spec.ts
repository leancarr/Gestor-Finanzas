import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  VaultsService,
  calculateVaultBalances,
} from './vaults.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { VaultRole } from '@prisma/client';

describe('VaultsService', () => {
  let service: VaultsService;

  const mockOwner = {
    id: 'user-owner',
    email: 'owner@test.com',
    name: 'Owner User',
    avatarUrl: null,
  };

  const mockAdmin = {
    id: 'user-admin',
    email: 'admin@test.com',
    name: 'Admin User',
    avatarUrl: null,
  };

  const mockMember = {
    id: 'user-member',
    email: 'member@test.com',
    name: 'Regular Member',
    avatarUrl: null,
  };

  const mockVault = {
    id: 'vault-1',
    name: 'Gastos Pareja',
    description: 'Gastos compartidos del hogar',
    ownerId: 'user-owner',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    owner: mockOwner,
    members: [
      {
        id: 'vm-1',
        vaultId: 'vault-1',
        userId: 'user-owner',
        role: VaultRole.OWNER,
        joinedAt: new Date('2026-01-01'),
        user: mockOwner,
      },
      {
        id: 'vm-2',
        vaultId: 'vault-1',
        userId: 'user-admin',
        role: VaultRole.ADMIN,
        joinedAt: new Date('2026-01-02'),
        user: mockAdmin,
      },
      {
        id: 'vm-3',
        vaultId: 'vault-1',
        userId: 'user-member',
        role: VaultRole.MEMBER,
        joinedAt: new Date('2026-01-03'),
        user: mockMember,
      },
    ],
    _count: {
      expenses: 5,
      members: 3,
    },
  };

  const mockTx = {
    vault: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    vaultMember: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    expense: {
      findMany: vi.fn(),
    },
  };

  const mockPrismaService = {
    withUser: vi.fn(async (_userId: string, cb: any) => {
      return cb(mockTx);
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VaultsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<VaultsService>(VaultsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateVaultBalances helper', () => {
    it('should return 0 balances when there are no expenses', () => {
      const members = [
        { userId: 'u1', user: { id: 'u1', name: 'User 1', email: 'u1@test.com', avatarUrl: null } },
        { userId: 'u2', user: { id: 'u2', name: 'User 2', email: 'u2@test.com', avatarUrl: null } },
      ];
      const result = calculateVaultBalances('vault-1', members, []);

      expect(result.totalExpenses).toBe(0);
      expect(result.fairSharePerMember).toBe(0);
      expect(result.totalMembers).toBe(2);
      expect(result.memberContributions[0].totalPaid).toBe(0);
      expect(result.memberContributions[0].percentage).toBe(0);
      expect(result.settlements).toHaveLength(0);
    });

    it('should calculate 50/50 settlements between 2 members correctly', () => {
      const members = [
        { userId: 'u1', user: { id: 'u1', name: 'Alice', email: 'alice@test.com', avatarUrl: null } },
        { userId: 'u2', user: { id: 'u2', name: 'Bob', email: 'bob@test.com', avatarUrl: null } },
      ];
      const expenses = [
        { userId: 'u1', amount: 100 },
      ];

      const result = calculateVaultBalances('vault-1', members, expenses);

      expect(result.totalExpenses).toBe(100);
      expect(result.fairSharePerMember).toBe(50);
      expect(result.memberContributions[0].totalPaid).toBe(100);
      expect(result.memberContributions[0].percentage).toBe(100);
      expect(result.memberContributions[1].totalPaid).toBe(0);
      expect(result.memberContributions[1].percentage).toBe(0);

      expect(result.settlements).toHaveLength(1);
      expect(result.settlements[0]).toEqual({
        fromUser: { id: 'u2', name: 'Bob', email: 'bob@test.com', avatarUrl: null },
        toUser: { id: 'u1', name: 'Alice', email: 'alice@test.com', avatarUrl: null },
        amount: 50,
      });
    });

    it('should handle multi-member settlements accurately', () => {
      const members = [
        { userId: 'u1', user: { id: 'u1', name: 'Alice', email: 'a@test.com', avatarUrl: null } },
        { userId: 'u2', user: { id: 'u2', name: 'Bob', email: 'b@test.com', avatarUrl: null } },
        { userId: 'u3', user: { id: 'u3', name: 'Charlie', email: 'c@test.com', avatarUrl: null } },
      ];
      // Total 150. Fair share: 50 each.
      // Alice paid 120 -> net +70
      // Bob paid 30 -> net -20
      // Charlie paid 0 -> net -50
      const expenses = [
        { userId: 'u1', amount: 120 },
        { userId: 'u2', amount: 30 },
      ];

      const result = calculateVaultBalances('vault-1', members, expenses);

      expect(result.totalExpenses).toBe(150);
      expect(result.fairSharePerMember).toBe(50);
      expect(result.settlements).toHaveLength(2);

      // Charlie owes Alice 50
      expect(result.settlements[0].fromUser.id).toBe('u3');
      expect(result.settlements[0].toUser.id).toBe('u1');
      expect(result.settlements[0].amount).toBe(50);

      // Bob owes Alice 20
      expect(result.settlements[1].fromUser.id).toBe('u2');
      expect(result.settlements[1].toUser.id).toBe('u1');
      expect(result.settlements[1].amount).toBe(20);
    });

    it('should generate no settlements when all members paid equally', () => {
      const members = [
        { userId: 'u1', user: { id: 'u1', name: 'Alice', email: 'a@test.com', avatarUrl: null } },
        { userId: 'u2', user: { id: 'u2', name: 'Bob', email: 'b@test.com', avatarUrl: null } },
      ];
      const expenses = [
        { userId: 'u1', amount: 50 },
        { userId: 'u2', amount: 50 },
      ];

      const result = calculateVaultBalances('vault-1', members, expenses);
      expect(result.totalExpenses).toBe(100);
      expect(result.fairSharePerMember).toBe(50);
      expect(result.settlements).toHaveLength(0);
    });
  });

  describe('create', () => {
    it('should create a vault and add creator as OWNER', async () => {
      mockTx.vault.create.mockResolvedValue(mockVault);

      const result = await service.create('user-owner', {
        name: 'Gastos Pareja',
        description: 'Gastos compartidos del hogar',
      });

      expect(mockPrismaService.withUser).toHaveBeenCalledWith('user-owner', expect.any(Function));
      expect(mockTx.vault.create).toHaveBeenCalledWith({
        data: {
          name: 'Gastos Pareja',
          description: 'Gastos compartidos del hogar',
          ownerId: 'user-owner',
          members: {
            create: {
              userId: 'user-owner',
              role: VaultRole.OWNER,
            },
          },
        },
        include: expect.any(Object),
      });
      expect(result).toEqual(mockVault);
    });
  });

  describe('findAll', () => {
    it('should return all vaults where user is owner or member', async () => {
      mockTx.vault.findMany.mockResolvedValue([mockVault]);

      const result = await service.findAll('user-owner');

      expect(mockPrismaService.withUser).toHaveBeenCalledWith('user-owner', expect.any(Function));
      expect(mockTx.vault.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ownerId: 'user-owner' },
            { members: { some: { userId: 'user-owner' } } },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return vault when user is owner', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      const result = await service.findOne('user-owner', 'vault-1');
      expect(result).toEqual(mockVault);
    });

    it('should return vault when user is member', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      const result = await service.findOne('user-member', 'vault-1');
      expect(result).toEqual(mockVault);
    });

    it('should throw NotFoundException if vault does not exist', async () => {
      mockTx.vault.findUnique.mockResolvedValue(null);

      await expect(service.findOne('user-owner', 'nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not in vault', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(service.findOne('stranger-user', 'vault-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should allow OWNER to update vault', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.vault.update.mockResolvedValue({
        ...mockVault,
        name: 'Nuevo Nombre',
      });

      const result = await service.update('user-owner', 'vault-1', {
        name: 'Nuevo Nombre',
      });

      expect(mockTx.vault.update).toHaveBeenCalledWith({
        where: { id: 'vault-1' },
        data: { name: 'Nuevo Nombre' },
        include: expect.any(Object),
      });
      expect(result.name).toBe('Nuevo Nombre');
    });

    it('should allow ADMIN to update vault', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.vault.update.mockResolvedValue({
        ...mockVault,
        description: 'Nueva descripción',
      });

      const result = await service.update('user-admin', 'vault-1', {
        description: 'Nueva descripción',
      });

      expect(mockTx.vault.update).toHaveBeenCalled();
      expect(result.description).toBe('Nueva descripción');
    });

    it('should throw NotFoundException if vault to update does not exist', async () => {
      mockTx.vault.findUnique.mockResolvedValue(null);

      await expect(
        service.update('user-owner', 'missing', { name: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if regular MEMBER tries to update', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(
        service.update('user-member', 'vault-1', { name: 'Hack' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('delete', () => {
    it('should allow OWNER to delete vault', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.vault.delete.mockResolvedValue(mockVault);

      const result = await service.delete('user-owner', 'vault-1');

      expect(mockTx.vault.delete).toHaveBeenCalledWith({
        where: { id: 'vault-1' },
      });
      expect(result.deletedVaultId).toBe('vault-1');
    });

    it('should throw NotFoundException if vault to delete does not exist', async () => {
      mockTx.vault.findUnique.mockResolvedValue(null);

      await expect(service.delete('user-owner', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if ADMIN tries to delete vault', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(service.delete('user-admin', 'vault-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if MEMBER tries to delete vault', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(service.delete('user-member', 'vault-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('addMember', () => {
    const newTargetUser = {
      id: 'new-user',
      email: 'newuser@test.com',
      name: 'New User',
      avatarUrl: null,
    };

    it('should allow OWNER to add a member', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.user.findUnique.mockResolvedValue(newTargetUser);
      mockTx.vaultMember.create.mockResolvedValue({
        id: 'vm-4',
        vaultId: 'vault-1',
        userId: 'new-user',
        role: VaultRole.MEMBER,
        user: newTargetUser,
      });

      const result = await service.addMember('user-owner', 'vault-1', {
        email: 'newuser@test.com',
        role: VaultRole.MEMBER,
      });

      expect(mockTx.vaultMember.create).toHaveBeenCalledWith({
        data: {
          vaultId: 'vault-1',
          userId: 'new-user',
          role: VaultRole.MEMBER,
        },
        include: expect.any(Object),
      });
      expect(result.userId).toBe('new-user');
    });

    it('should allow ADMIN to add a member', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.user.findUnique.mockResolvedValue(newTargetUser);
      mockTx.vaultMember.create.mockResolvedValue({
        id: 'vm-4',
        vaultId: 'vault-1',
        userId: 'new-user',
        role: VaultRole.MEMBER,
        user: newTargetUser,
      });

      const result = await service.addMember('user-admin', 'vault-1', {
        email: 'newuser@test.com',
      });

      expect(result.userId).toBe('new-user');
    });

    it('should throw NotFoundException if vault does not exist', async () => {
      mockTx.vault.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember('user-owner', 'missing', { email: 'a@b.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if regular MEMBER tries to add member', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(
        service.addMember('user-member', 'vault-1', { email: 'a@b.com' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if invited user does not exist in DB', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.user.findUnique.mockResolvedValue(null);

      await expect(
        service.addMember('user-owner', 'vault-1', { email: 'unknown@test.com' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user is already a member', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.user.findUnique.mockResolvedValue(mockAdmin);

      await expect(
        service.addMember('user-owner', 'vault-1', { email: 'admin@test.com' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('removeMember', () => {
    it('should allow OWNER to remove a member', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.vaultMember.delete.mockResolvedValue({});

      const result = await service.removeMember('user-owner', 'vault-1', 'user-member');

      expect(mockTx.vaultMember.delete).toHaveBeenCalledWith({
        where: {
          vaultId_userId: {
            vaultId: 'vault-1',
            userId: 'user-member',
          },
        },
      });
      expect(result.removedUserId).toBe('user-member');
    });

    it('should allow a member to leave the vault themselves', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.vaultMember.delete.mockResolvedValue({});

      const result = await service.removeMember('user-member', 'vault-1', 'user-member');

      expect(result.message).toContain('Has abandonado la bóveda');
    });

    it('should throw BadRequestException if attempting to remove the OWNER', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(
        service.removeMember('user-admin', 'vault-1', 'user-owner'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if vault does not exist', async () => {
      mockTx.vault.findUnique.mockResolvedValue(null);

      await expect(
        service.removeMember('user-owner', 'missing', 'user-member'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if target member is not in vault', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(
        service.removeMember('user-owner', 'vault-1', 'random-user'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if regular member tries to remove another member', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(
        service.removeMember('user-member', 'vault-1', 'user-admin'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateMemberRole', () => {
    it('should allow OWNER to change member role', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.vaultMember.update.mockResolvedValue({
        id: 'vm-3',
        vaultId: 'vault-1',
        userId: 'user-member',
        role: VaultRole.ADMIN,
        user: mockMember,
      });

      const result = await service.updateMemberRole(
        'user-owner',
        'vault-1',
        'user-member',
        { role: VaultRole.ADMIN },
      );

      expect(mockTx.vaultMember.update).toHaveBeenCalledWith({
        where: {
          vaultId_userId: {
            vaultId: 'vault-1',
            userId: 'user-member',
          },
        },
        data: { role: VaultRole.ADMIN },
        include: expect.any(Object),
      });
      expect(result.role).toBe(VaultRole.ADMIN);
    });

    it('should throw BadRequestException if trying to update OWNER role', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(
        service.updateMemberRole('user-owner', 'vault-1', 'user-owner', {
          role: VaultRole.MEMBER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if target member not found', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(
        service.updateMemberRole('user-owner', 'vault-1', 'missing-user', {
          role: VaultRole.ADMIN,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if non-owner/non-admin tries to change role', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(
        service.updateMemberRole('user-member', 'vault-1', 'user-admin', {
          role: VaultRole.VIEWER,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getBalances', () => {
    it('should calculate and return balances for vault members', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);
      mockTx.expense.findMany.mockResolvedValue([
        { amount: '120.00', userId: 'user-owner' },
        { amount: '30.00', userId: 'user-admin' },
      ]);

      const result = await service.getBalances('user-owner', 'vault-1');

      expect(result.vaultId).toBe('vault-1');
      expect(result.totalExpenses).toBe(150);
      expect(result.fairSharePerMember).toBe(50);
      expect(result.memberContributions).toHaveLength(3);
      expect(result.settlements).toBeDefined();
    });

    it('should throw NotFoundException if vault does not exist', async () => {
      mockTx.vault.findUnique.mockResolvedValue(null);

      await expect(service.getBalances('user-owner', 'missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user is not member of vault', async () => {
      mockTx.vault.findUnique.mockResolvedValue(mockVault);

      await expect(
        service.getBalances('outsider-user', 'vault-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
