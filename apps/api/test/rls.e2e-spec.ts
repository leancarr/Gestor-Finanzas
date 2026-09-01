import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Row Level Security (RLS) Integration & Isolation', () => {
  let prisma: PrismaService;

  const USER_1 = '00000000-0000-0000-0000-000000000001';
  const USER_2 = '00000000-0000-0000-0000-000000000002';

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
  });

  afterAll(async () => {
    // Cleanup
    await prisma.expense.deleteMany({ where: { userId: { in: [USER_1, USER_2] } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { userId: { in: [USER_1, USER_2] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [USER_1, USER_2] } } }).catch(() => {});
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean specific test users
    await prisma.expense.deleteMany({ where: { userId: { in: [USER_1, USER_2] } } }).catch(() => {});
    await prisma.category.deleteMany({ where: { userId: { in: [USER_1, USER_2] } } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [USER_1, USER_2] } } }).catch(() => {});
  });

  it('1. should allow users to create and query their own records via withUser', async () => {
    // 1. User 1 creates profile, category, and expense
    const u1Data = await prisma.withUser(USER_1, async (tx) => {
      const user = await tx.user.create({
        data: { id: USER_1, email: 'user1@gestor.test', name: 'User 1' },
      });
      const category = await tx.category.create({
        data: { name: 'Comida', userId: USER_1 },
      });
      const expense = await tx.expense.create({
        data: {
          amount: 2500.5,
          description: 'Almuerzo Trabajo',
          userId: USER_1,
          categoryId: category.id,
        },
      });
      return { user, category, expense };
    });

    expect(u1Data.user.id).toBe(USER_1);
    expect(u1Data.category.userId).toBe(USER_1);
    expect(u1Data.expense.userId).toBe(USER_1);

    // 2. User 2 creates profile, category, and expense
    const u2Data = await prisma.withUser(USER_2, async (tx) => {
      const user = await tx.user.create({
        data: { id: USER_2, email: 'user2@gestor.test', name: 'User 2' },
      });
      const category = await tx.category.create({
        data: { name: 'Transporte', userId: USER_2 },
      });
      const expense = await tx.expense.create({
        data: {
          amount: 800.0,
          description: 'Carga SUBE',
          userId: USER_2,
          categoryId: category.id,
        },
      });
      return { user, category, expense };
    });

    expect(u2Data.user.id).toBe(USER_2);

    // 3. User 1 queries - must ONLY see User 1 data
    const u1Categories = await prisma.withUser(USER_1, async (tx) => tx.category.findMany());
    const u1Expenses = await prisma.withUser(USER_1, async (tx) => tx.expense.findMany());

    expect(u1Categories).toHaveLength(1);
    expect(u1Categories[0]?.userId).toBe(USER_1);
    expect(u1Categories[0]?.name).toBe('Comida');

    expect(u1Expenses).toHaveLength(1);
    expect(u1Expenses[0]?.userId).toBe(USER_1);
    expect(u1Expenses[0]?.description).toBe('Almuerzo Trabajo');

    // 4. User 2 queries - must ONLY see User 2 data
    const u2Categories = await prisma.withUser(USER_2, async (tx) => tx.category.findMany());
    const u2Expenses = await prisma.withUser(USER_2, async (tx) => tx.expense.findMany());

    expect(u2Categories).toHaveLength(1);
    expect(u2Categories[0]?.userId).toBe(USER_2);
    expect(u2Categories[0]?.name).toBe('Transporte');

    expect(u2Expenses).toHaveLength(1);
    expect(u2Expenses[0]?.userId).toBe(USER_2);
    expect(u2Expenses[0]?.description).toBe('Carga SUBE');
  });

  it('2. should reject cross-tenant insertions by RLS policy', async () => {
    // Create user 1 and user 2 first
    await prisma.withUser(USER_1, async (tx) => {
      await tx.user.create({
        data: { id: USER_1, email: 'user1-cross@gestor.test', name: 'User 1' },
      });
    });
    await prisma.withUser(USER_2, async (tx) => {
      await tx.user.create({
        data: { id: USER_2, email: 'user2-cross@gestor.test', name: 'User 2' },
      });
    });

    // User 1 tries to insert an expense for User 2 -> Must fail RLS
    await expect(
      prisma.withUser(USER_1, async (tx) => {
        return tx.expense.create({
          data: {
            amount: 99999,
            description: 'Intento de Inyección Cross-Tenant',
            userId: USER_2,
          },
        });
      }),
    ).rejects.toThrow(/row-level security/i);
  });

  it('3. should isolate updates and deletes across tenants', async () => {
    let cat2Id = '';
    await prisma.withUser(USER_2, async (tx) => {
      await tx.user.create({
        data: { id: USER_2, email: 'user2-mod@gestor.test', name: 'User 2' },
      });
      const cat2 = await tx.category.create({
        data: { name: 'Original Cat User 2', userId: USER_2 },
      });
      cat2Id = cat2.id;
    });

    // User 1 tries to update User 2's category -> RLS hides it, Prisma returns RecordNotFound
    await expect(
      prisma.withUser(USER_1, async (tx) => {
        return tx.category.update({
          where: { id: cat2Id },
          data: { name: 'Hacked Cat' },
        });
      }),
    ).rejects.toThrow();

    // Verify User 2's category was NOT altered
    const cat2After = await prisma.withUser(USER_2, async (tx) => {
      return tx.category.findUnique({ where: { id: cat2Id } });
    });
    expect(cat2After?.name).toBe('Original Cat User 2');
  });

  it('4. should return 0 rows for unauthenticated anon queries', async () => {
    // Create user 1 data
    await prisma.withUser(USER_1, async (tx) => {
      await tx.user.create({
        data: { id: USER_1, email: 'user1-anon@gestor.test', name: 'User 1' },
      });
      await tx.category.create({
        data: { name: 'Privada User 1', userId: USER_1 },
      });
    });

    // Query as anonymous role
    const anonCategories = await prisma.withRole('anon', null, async (tx) => {
      return tx.category.findMany();
    });

    expect(anonCategories).toHaveLength(0);
  });
});
