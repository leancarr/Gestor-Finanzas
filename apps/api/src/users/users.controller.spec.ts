import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import type { AuthUser } from '../auth/auth.interface.js';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockUser: AuthUser = {
    id: 'user-123',
    email: 'test@gestorguita.local',
    role: 'authenticated',
  };

  const mockProfile = {
    id: 'user-123',
    email: 'test@gestorguita.local',
    name: 'Leandro Carr',
    avatarUrl: 'https://example.com/avatar.jpg',
    createdAt: new Date(),
  };

  const mockUsersService = {
    getProfile: vi.fn().mockResolvedValue(mockProfile),
    updateProfile: vi.fn().mockResolvedValue({
      ...mockProfile,
      name: 'Leandro Actualizado',
    }),
    deleteAccount: vi.fn().mockResolvedValue({
      message: 'Cuenta y datos eliminados permanentemente (GDPR compliant)',
      deletedUserId: 'user-123',
    }),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should get profile for authenticated user', async () => {
    const result = await controller.getProfile(mockUser);
    expect(mockUsersService.getProfile).toHaveBeenCalledWith('user-123');
    expect(result).toEqual(mockProfile);
  });

  it('should update profile for authenticated user', async () => {
    const dto = {
      name: 'Leandro Actualizado',
      avatarUrl: 'https://example.com/new.jpg',
    };
    const result = await controller.updateProfile(mockUser, dto);
    expect(mockUsersService.updateProfile).toHaveBeenCalledWith('user-123', dto);
    expect(result.name).toBe('Leandro Actualizado');
  });

  it('should permanently delete account and data for authenticated user (GDPR)', async () => {
    const result = await controller.deleteAccount(mockUser);
    expect(mockUsersService.deleteAccount).toHaveBeenCalledWith('user-123');
    expect(result).toEqual({
      message: 'Cuenta y datos eliminados permanentemente (GDPR compliant)',
      deletedUserId: 'user-123',
    });
  });
});
