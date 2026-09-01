import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockPrismaService = {
    withUser: vi.fn(async (_userId: string, cb: any) => {
      return cb(mockPrismaService);
    }),
    user: {
      upsert: vi.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'test@gestorguita.local',
        name: 'Test User',
      }),
    },
  };

  const mockConfigService = {
    get: vi.fn((key: string) => {
      if (key === 'SUPABASE_JWT_SECRET') return 'test-secret';
      if (key === 'SUPABASE_URL') return 'https://test.supabase.co';
      if (key === 'SUPABASE_ANON_KEY') return 'test-anon-key';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
  });

  it('should return auth status from getStatus()', () => {
    const status = controller.getStatus();
    expect(status.status).toBe('ok');
    expect(status.auth.strategy).toBe('supabase-jwt');
    expect(status.auth.configured).toBe(true);
  });

  it('should return authenticated user profile from getProfile()', async () => {
    const mockUser = {
      id: 'test-user-id',
      email: 'test@gestorguita.local',
      role: 'authenticated',
      userMetadata: { name: 'Test User' },
    };

    const response = await controller.getProfile(mockUser);
    expect(response.authenticated).toBe(true);
    expect(response.user.id).toBe('test-user-id');
    expect(response.profile?.name).toBe('Test User');
  });
});
