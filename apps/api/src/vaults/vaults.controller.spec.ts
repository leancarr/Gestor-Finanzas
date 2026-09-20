import { Test, TestingModule } from '@nestjs/testing';
import { VaultsController } from './vaults.controller.js';
import { VaultsService } from './vaults.service.js';
import { VaultRole } from '@prisma/client';
import type { AuthUser } from '../auth/auth.interface.js';

describe('VaultsController', () => {
  let controller: VaultsController;
  let service: VaultsService;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };

  const mockVault = {
    id: 'vault-1',
    name: 'Gastos Pareja',
    description: 'Gastos compartidos',
    ownerId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [],
  };

  const mockBalances = {
    vaultId: 'vault-1',
    totalExpenses: 200,
    fairSharePerMember: 100,
    totalMembers: 2,
    memberContributions: [],
    settlements: [],
  };

  const mockVaultsService = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addMember: vi.fn(),
    removeMember: vi.fn(),
    updateMemberRole: vi.fn(),
    getBalances: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VaultsController],
      providers: [
        {
          provide: VaultsService,
          useValue: mockVaultsService,
        },
      ],
    }).compile();

    controller = module.get<VaultsController>(VaultsController);
    service = module.get<VaultsService>(VaultsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should call service.create with user id and dto', async () => {
      const dto = { name: 'Bóveda Vacaciones', description: 'Viaje a Brasil' };
      mockVaultsService.create.mockResolvedValue(mockVault);

      const result = await controller.create(mockUser, dto);

      expect(service.create).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(mockVault);
    });
  });

  describe('findAll', () => {
    it('should call service.findAll with user id', async () => {
      mockVaultsService.findAll.mockResolvedValue([mockVault]);

      const result = await controller.findAll(mockUser);

      expect(service.findAll).toHaveBeenCalledWith('user-123');
      expect(result).toEqual([mockVault]);
    });
  });

  describe('findOne', () => {
    it('should call service.findOne with user id and vault id', async () => {
      mockVaultsService.findOne.mockResolvedValue(mockVault);

      const result = await controller.findOne(mockUser, 'vault-1');

      expect(service.findOne).toHaveBeenCalledWith('user-123', 'vault-1');
      expect(result).toEqual(mockVault);
    });
  });

  describe('update', () => {
    it('should call service.update with user id, vault id, and dto', async () => {
      const dto = { name: 'Nombre Actualizado' };
      const updated = { ...mockVault, name: 'Nombre Actualizado' };
      mockVaultsService.update.mockResolvedValue(updated);

      const result = await controller.update(mockUser, 'vault-1', dto);

      expect(service.update).toHaveBeenCalledWith('user-123', 'vault-1', dto);
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should call service.delete with user id and vault id', async () => {
      const res = { message: 'Bóveda eliminada con éxito', deletedVaultId: 'vault-1' };
      mockVaultsService.delete.mockResolvedValue(res);

      const result = await controller.delete(mockUser, 'vault-1');

      expect(service.delete).toHaveBeenCalledWith('user-123', 'vault-1');
      expect(result).toEqual(res);
    });
  });

  describe('addMember', () => {
    it('should call service.addMember with user id, vault id, and dto', async () => {
      const dto = { email: 'pareja@test.com', role: VaultRole.MEMBER };
      const memberResult = { id: 'vm-2', userId: 'user-456', role: VaultRole.MEMBER };
      mockVaultsService.addMember.mockResolvedValue(memberResult);

      const result = await controller.addMember(mockUser, 'vault-1', dto);

      expect(service.addMember).toHaveBeenCalledWith('user-123', 'vault-1', dto);
      expect(result).toEqual(memberResult);
    });
  });

  describe('removeMember', () => {
    it('should call service.removeMember with user id, vault id, and memberUserId', async () => {
      const res = { message: 'Miembro removido con éxito', removedUserId: 'user-456', vaultId: 'vault-1' };
      mockVaultsService.removeMember.mockResolvedValue(res);

      const result = await controller.removeMember(mockUser, 'vault-1', 'user-456');

      expect(service.removeMember).toHaveBeenCalledWith('user-123', 'vault-1', 'user-456');
      expect(result).toEqual(res);
    });
  });

  describe('updateMemberRole', () => {
    it('should call service.updateMemberRole with user id, vault id, memberUserId, and dto', async () => {
      const dto = { role: VaultRole.ADMIN };
      const res = { id: 'vm-2', userId: 'user-456', role: VaultRole.ADMIN };
      mockVaultsService.updateMemberRole.mockResolvedValue(res);

      const result = await controller.updateMemberRole(mockUser, 'vault-1', 'user-456', dto);

      expect(service.updateMemberRole).toHaveBeenCalledWith('user-123', 'vault-1', 'user-456', dto);
      expect(result).toEqual(res);
    });
  });

  describe('getBalances', () => {
    it('should call service.getBalances with user id and vault id', async () => {
      mockVaultsService.getBalances.mockResolvedValue(mockBalances);

      const result = await controller.getBalances(mockUser, 'vault-1');

      expect(service.getBalances).toHaveBeenCalledWith('user-123', 'vault-1');
      expect(result).toEqual(mockBalances);
    });
  });
});
