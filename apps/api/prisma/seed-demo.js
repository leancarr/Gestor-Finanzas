import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Demo 1
const DEMO_USER_ID = 'usr_85994edbd027068e';
const DEMO_EMAIL = 'demo@gestorguita.com';
const DEMO_NAME = 'Demo User';
const DEMO_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80';

// Demo 2 (Flor Demo)
const DEMO2_USER_ID = 'usr_8b66d87fc58275a8';
const DEMO2_EMAIL = 'demo2@gestorguita.com';
const DEMO2_NAME = 'Flor Demo';
const DEMO2_AVATAR = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80';

// Catálogo estándar de 14 categorías
const DEFAULT_CATEGORIES = [
  { name: 'Salario & Sueldo', icon: 'Banknote', color: '#10B981' },
  { name: 'Freelance & Ventas', icon: 'Briefcase', color: '#06B6D4' },
  { name: 'Supermercado & Alimentos', icon: 'ShoppingCart', color: '#10B981' },
  { name: 'Comida & Salidas', icon: 'Utensils', color: '#F59E0B' },
  { name: 'Transporte & Combustible', icon: 'Car', color: '#3B82F6' },
  { name: 'Vivienda & Servicios', icon: 'Home', color: '#6366F1' },
  { name: 'Servicios & Facturas', icon: 'CreditCard', color: '#EC4899' },
  { name: 'Salud & Farmacia', icon: 'HeartPulse', color: '#EF4444' },
  { name: 'Entretenimiento & Ocio', icon: 'Gamepad2', color: '#8B5CF6' },
  { name: 'Educación & Cursos', icon: 'GraduationCap', color: '#06B6D4' },
  { name: 'Compras & Ropa', icon: 'ShoppingBag', color: '#14B8A6' },
  { name: 'Inversiones & Ahorro', icon: 'TrendingUp', color: '#22C55E' },
  { name: 'Viajes & Vacaciones', icon: 'Plane', color: '#0EA5E9' },
  { name: 'Otros Gastos', icon: 'MoreHorizontal', color: '#64748B' },
];

async function ensureUserCategories(userId) {
  const existing = await prisma.category.findMany({ where: { userId } });
  const existingNames = new Set(existing.map((c) => c.name));

  const missing = DEFAULT_CATEGORIES.filter((c) => !existingNames.has(c.name));
  if (missing.length > 0) {
    await prisma.category.createMany({
      data: missing.map((c) => ({
        name: c.name,
        icon: c.icon,
        color: c.color,
        userId,
      })),
    });
  }

  const all = await prisma.category.findMany({ where: { userId } });
  const map = new Map();
  all.forEach((c) => map.set(c.name, c.id));
  return map;
}

async function main() {
  console.log(`🚀 Iniciando carga de datos mock en Neon PostgreSQL...`);
  console.log(`👤 Usuario Demo 1: ${DEMO_EMAIL} (${DEMO_USER_ID})`);
  console.log(`👤 Usuario Demo 2: ${DEMO2_EMAIL} (${DEMO2_USER_ID})`);

  // 1. Asegurar usuarios en Neon
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      avatarUrl: DEMO_AVATAR,
    },
    create: {
      id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      name: DEMO_NAME,
      avatarUrl: DEMO_AVATAR,
    },
  });

  await prisma.user.upsert({
    where: { id: DEMO2_USER_ID },
    update: {
      email: DEMO2_EMAIL,
      name: DEMO2_NAME,
      avatarUrl: DEMO2_AVATAR,
    },
    create: {
      id: DEMO2_USER_ID,
      email: DEMO2_EMAIL,
      name: DEMO2_NAME,
      avatarUrl: DEMO2_AVATAR,
    },
  });

  console.log(`✅ Usuarios Demo 1 y Demo 2 asegurados.`);

  // 2. Asegurar categorías para ambos usuarios
  const catMapDemo1 = await ensureUserCategories(DEMO_USER_ID);
  const catMapDemo2 = await ensureUserCategories(DEMO2_USER_ID);
  console.log(`✅ Categorías verificadas: ${catMapDemo1.size} para Demo 1, ${catMapDemo2.size} para Demo 2.`);

  // 3. Limpieza de datos previos de ambos usuarios demo y bóvedas compartidas
  const demoVaults = await prisma.vault.findMany({
    where: {
      OR: [
        { ownerId: { in: [DEMO_USER_ID, DEMO2_USER_ID] } },
        {
          name: {
            in: [
              'Viaje Bariloche 2026',
              'Gastos de la Casa',
              'Salidas & Amigos',
              'Proyectos Compartidos',
            ],
          },
        },
      ],
    },
    select: { id: true },
  });
  const demoVaultIds = demoVaults.map((v) => v.id);

  await prisma.expense.deleteMany({
    where: {
      OR: [
        { vaultId: { in: demoVaultIds } },
        { userId: { in: [DEMO_USER_ID, DEMO2_USER_ID] } },
      ],
    },
  });

  if (demoVaultIds.length > 0) {
    await prisma.vault.deleteMany({
      where: { id: { in: demoVaultIds } },
    });
  }

  await prisma.budget.deleteMany({
    where: { userId: { in: [DEMO_USER_ID, DEMO2_USER_ID] } },
  });

  await prisma.recurringTransaction.deleteMany({
    where: { userId: { in: [DEMO_USER_ID, DEMO2_USER_ID] } },
  });

  await prisma.asset.deleteMany({
    where: { userId: { in: [DEMO_USER_ID, DEMO2_USER_ID] } },
  });

  console.log(`🧹 Limpieza previa completada sin afectar a otros usuarios.`);

  // 4. Cargar Activos de Inversión (Ticket SEI-67)
  // Demo 1: AAPL, SPY, Plazo Fijo Tradicional, Dólar MEP, Bitcoin BTC
  const demo1Assets = [
    {
      name: 'CEDEAR Apple (AAPL)',
      type: 'CEDEAR',
      ticker: 'AAPL',
      quantity: 25.0,
      purchasePrice: 4200.0,
      currentPrice: 4850.0, // 25 * 4850 = $121.250 ARS
      currency: 'ARS',
      institution: 'Bull Market Brokers',
      notes: '25 acciones CEDEAR Apple Inc.',
      userId: DEMO_USER_ID,
    },
    {
      name: 'CEDEAR SPY (S&P 500)',
      type: 'CEDEAR',
      ticker: 'SPY',
      quantity: 15.0,
      purchasePrice: 11500.0,
      currentPrice: 12850.0, // 15 * 12850 = $192.750 ARS
      currency: 'ARS',
      institution: 'InvertirOnline (IOL)',
      notes: '15 acciones ETF SPDR S&P 500',
      userId: DEMO_USER_ID,
    },
    {
      name: 'Plazo Fijo Tradicional',
      type: 'FIXED_TERM',
      quantity: 2000000.0,
      purchasePrice: 2000000.0,
      currentPrice: 2060821.0, // Capital $2.000.000 + rendimiento proyectado
      currency: 'ARS',
      institution: 'Banco Galicia',
      interestRate: 37.0,
      dueDate: new Date(Date.now() + 20 * 86400000),
      notes: 'Plazo Fijo a 30 días, TNA 37%',
      userId: DEMO_USER_ID,
    },
    {
      name: 'Dólar MEP',
      type: 'CASH_USD',
      quantity: 3500.0,
      purchasePrice: 1.0,
      currentPrice: 1.0,
      currency: 'USD',
      institution: 'Balanz',
      notes: '3.500 USD disponibles en cuenta comitente',
      userId: DEMO_USER_ID,
    },
    {
      name: 'Bitcoin BTC',
      type: 'CRYPTO',
      ticker: 'BTC',
      quantity: 0.065,
      purchasePrice: 58500.0,
      currentPrice: 64500.0, // ~4.192 USD
      currency: 'USD',
      institution: 'Hardware Wallet (Trezor)',
      notes: '0.065 BTC reserva en custodia fría',
      userId: DEMO_USER_ID,
    },
  ];

  // Demo 2: MELI, Plazo Fijo Santander, Dólar Ahorro, Ethereum ETH
  const demo2Assets = [
    {
      name: 'CEDEAR MercadoLibre (MELI)',
      type: 'CEDEAR',
      ticker: 'MELI',
      quantity: 20.0,
      purchasePrice: 18500.0,
      currentPrice: 21400.0,
      currency: 'ARS',
      institution: 'Balanz',
      notes: '20 acciones CEDEAR MercadoLibre Inc.',
      userId: DEMO2_USER_ID,
    },
    {
      name: 'Plazo Fijo Banco Santander',
      type: 'FIXED_TERM',
      quantity: 1200000.0,
      purchasePrice: 1200000.0,
      currentPrice: 1236500.0,
      currency: 'ARS',
      institution: 'Banco Santander',
      interestRate: 37.0,
      dueDate: new Date(Date.now() + 15 * 86400000),
      notes: 'Plazo fijo 30 días TNA 37%',
      userId: DEMO2_USER_ID,
    },
    {
      name: 'Dólar Ahorro',
      type: 'CASH_USD',
      quantity: 2200.0,
      purchasePrice: 1.0,
      currentPrice: 1.0,
      currency: 'USD',
      institution: 'Banco Santander',
      notes: '2.200 USD disponibles en caja de ahorro',
      userId: DEMO2_USER_ID,
    },
    {
      name: 'Ethereum ETH',
      type: 'CRYPTO',
      ticker: 'ETH',
      quantity: 1.25,
      purchasePrice: 2850.0,
      currentPrice: 3300.0,
      currency: 'USD',
      institution: 'Ledger Nano S',
      notes: '1.25 ETH reserva cripto',
      userId: DEMO2_USER_ID,
    },
  ];

  await prisma.asset.createMany({ data: [...demo1Assets, ...demo2Assets] });
  console.log(`✅ ${demo1Assets.length + demo2Assets.length} activos de inversión creados (${demo1Assets.length} Demo 1, ${demo2Assets.length} Demo 2)`);

  // 5. Cargar Ingresos y Gastos Personales para Demo 1 (Septiembre y Agosto 2026)
  const demo1Incomes = [
    {
      amount: 1850000.0,
      currency: 'ARS',
      type: 'INCOME',
      description: 'Sueldo Empresa Tech (Septiembre)',
      date: new Date('2026-09-01T10:00:00Z'),
      categoryId: catMapDemo1.get('Salario & Sueldo') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 450000.0,
      currency: 'ARS',
      type: 'INCOME',
      description: 'Proyecto Freelance UI/UX Mobile App',
      date: new Date('2026-09-10T15:30:00Z'),
      categoryId: catMapDemo1.get('Freelance & Ventas') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 72500.0,
      currency: 'ARS',
      type: 'INCOME',
      description: 'Rendimientos Fondos Comunes e Inversiones',
      date: new Date('2026-09-15T12:00:00Z'),
      categoryId: catMapDemo1.get('Inversiones & Ahorro') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 1750000.0,
      currency: 'ARS',
      type: 'INCOME',
      description: 'Sueldo Empresa Tech (Agosto)',
      date: new Date('2026-08-01T10:00:00Z'),
      categoryId: catMapDemo1.get('Salario & Sueldo') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 380000.0,
      currency: 'ARS',
      type: 'INCOME',
      description: 'Consultoría Arquitectura NestJS',
      date: new Date('2026-08-14T18:00:00Z'),
      categoryId: catMapDemo1.get('Freelance & Ventas') || null,
      userId: DEMO_USER_ID,
    },
  ];

  const demo1ExpensesSept = [
    {
      amount: 380000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Alquiler Depto Palermo Soho',
      date: new Date('2026-09-02T11:00:00Z'),
      categoryId: catMapDemo1.get('Vivienda & Servicios') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 65000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Expensas Ordinarias Edificio',
      date: new Date('2026-09-03T14:20:00Z'),
      categoryId: catMapDemo1.get('Vivienda & Servicios') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 148500.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Compra Quincenal Coto Digital',
      date: new Date('2026-09-04T16:45:00Z'),
      categoryId: catMapDemo1.get('Supermercado & Alimentos') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 39500.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Combustible YPF Infinia (Tanque lleno)',
      date: new Date('2026-09-05T09:15:00Z'),
      categoryId: catMapDemo1.get('Transporte & Combustible') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 54000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Cena Asado en Don Julio con Amigos',
      date: new Date('2026-09-06T21:30:00Z'),
      categoryId: catMapDemo1.get('Comida & Salidas') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 19200.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Farmacia Farmacity remedios y botiquín',
      date: new Date('2026-09-07T12:10:00Z'),
      categoryId: catMapDemo1.get('Salud & Farmacia') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 14200.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Netflix Premium & Spotify Familiar',
      date: new Date('2026-09-08T08:00:00Z'),
      categoryId: catMapDemo1.get('Servicios & Facturas') || null,
      userId: DEMO_USER_ID,
      isTaxable: true,
    },
    {
      amount: 32000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Cuota Mensual Gimnasio Megatlon',
      date: new Date('2026-09-09T18:00:00Z'),
      categoryId: catMapDemo1.get('Salud & Farmacia') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 7800.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Café de Especialidad y Bakery en Cuervo',
      date: new Date('2026-09-11T17:00:00Z'),
      categoryId: catMapDemo1.get('Comida & Salidas') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 62400.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Reposición Alimentos y Limpieza en Jumbo',
      date: new Date('2026-09-12T13:30:00Z'),
      categoryId: catMapDemo1.get('Supermercado & Alimentos') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 21000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Entradas Cine IMAX & Combo Pochoclos',
      date: new Date('2026-09-13T20:00:00Z'),
      categoryId: catMapDemo1.get('Entretenimiento & Ocio') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 115000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Zapatillas Nike Air Running',
      date: new Date('2026-09-14T19:15:00Z'),
      categoryId: catMapDemo1.get('Compras & Ropa') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 36800.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Facturas Luz Edenor & Metrogas',
      date: new Date('2026-09-16T11:45:00Z'),
      categoryId: catMapDemo1.get('Servicios & Facturas') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 26500.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Delivery Sushi Premium Domicilio',
      date: new Date('2026-09-17T22:00:00Z'),
      categoryId: catMapDemo1.get('Comida & Salidas') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 40.0,
      currency: 'USD',
      type: 'EXPENSE',
      description: 'Suscripción Claude Team & ChatGPT Plus',
      date: new Date('2026-09-18T10:00:00Z'),
      categoryId: catMapDemo1.get('Educación & Cursos') || null,
      userId: DEMO_USER_ID,
      exchangeRate: 1350.0,
      isTaxable: true,
    },
    {
      amount: 34200.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Carnicería & Verdulería de barrio',
      date: new Date('2026-09-19T11:30:00Z'),
      categoryId: catMapDemo1.get('Supermercado & Alimentos') || null,
      userId: DEMO_USER_ID,
    },
  ];

  const demo1ExpensesAgo = [
    {
      amount: 380000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Alquiler Depto Palermo Soho',
      date: new Date('2026-08-02T11:00:00Z'),
      categoryId: catMapDemo1.get('Vivienda & Servicios') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 58000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Expensas Ordinarias Edificio',
      date: new Date('2026-08-03T14:20:00Z'),
      categoryId: catMapDemo1.get('Vivienda & Servicios') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 185000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Supermercado Coto del mes',
      date: new Date('2026-08-05T16:45:00Z'),
      categoryId: catMapDemo1.get('Supermercado & Alimentos') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 41000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Carga Combustible Shell V-Power',
      date: new Date('2026-08-10T09:15:00Z'),
      categoryId: catMapDemo1.get('Transporte & Combustible') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 48000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Salida Parrilla La Brigada San Telmo',
      date: new Date('2026-08-15T21:30:00Z'),
      categoryId: catMapDemo1.get('Comida & Salidas') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 32000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Gimnasio Megatlon cuota Agosto',
      date: new Date('2026-08-18T18:00:00Z'),
      categoryId: catMapDemo1.get('Salud & Farmacia') || null,
      userId: DEMO_USER_ID,
    },
    {
      amount: 82000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Compras Ropa de Invierno Zara',
      date: new Date('2026-08-25T19:00:00Z'),
      categoryId: catMapDemo1.get('Compras & Ropa') || null,
      userId: DEMO_USER_ID,
    },
  ];

  // 6. Cargar Ingresos y Gastos Personales para Demo 2 (Flor Demo)
  const demo2Incomes = [
    {
      amount: 2100000.0,
      currency: 'ARS',
      type: 'INCOME',
      description: 'Sueldo Diseñadora Senior Product',
      date: new Date('2026-09-01T10:00:00Z'),
      categoryId: catMapDemo2.get('Salario & Sueldo') || null,
      userId: DEMO2_USER_ID,
    },
    {
      amount: 520000.0,
      currency: 'ARS',
      type: 'INCOME',
      description: 'Freelance UI/UX Design System SaaS',
      date: new Date('2026-09-12T16:00:00Z'),
      categoryId: catMapDemo2.get('Freelance & Ventas') || null,
      userId: DEMO2_USER_ID,
    },
  ];

  const demo2Expenses = [
    {
      amount: 32000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Clases de Pilates & Yoga Estudio',
      date: new Date('2026-09-04T18:00:00Z'),
      categoryId: catMapDemo2.get('Salud & Farmacia') || null,
      userId: DEMO2_USER_ID,
    },
    {
      amount: 145000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Supermercado Carrefour Market Recoleta',
      date: new Date('2026-09-07T14:30:00Z'),
      categoryId: catMapDemo2.get('Supermercado & Alimentos') || null,
      userId: DEMO2_USER_ID,
    },
    {
      amount: 28000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Peluquería y cuidado personal',
      date: new Date('2026-09-10T12:00:00Z'),
      categoryId: catMapDemo2.get('Salud & Farmacia') || null,
      userId: DEMO2_USER_ID,
    },
    {
      amount: 11500.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Suscripción Spotify Familiar & HBO Max',
      date: new Date('2026-09-11T09:00:00Z'),
      categoryId: catMapDemo2.get('Servicios & Facturas') || null,
      userId: DEMO2_USER_ID,
      isTaxable: true,
    },
    {
      amount: 26000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Cena Gourmet Delivery Rappi',
      date: new Date('2026-09-14T21:00:00Z'),
      categoryId: catMapDemo2.get('Comida & Salidas') || null,
      userId: DEMO2_USER_ID,
    },
    {
      amount: 75000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Compras Ropa de Primavera Zara',
      date: new Date('2026-09-16T19:30:00Z'),
      categoryId: catMapDemo2.get('Compras & Ropa') || null,
      userId: DEMO2_USER_ID,
    },
    {
      amount: 18500.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Farmacity Cosméticos y Skincare',
      date: new Date('2026-09-18T16:00:00Z'),
      categoryId: catMapDemo2.get('Salud & Farmacia') || null,
      userId: DEMO2_USER_ID,
    },
  ];

  const allPersonalExpenses = [
    ...demo1Incomes,
    ...demo1ExpensesSept,
    ...demo1ExpensesAgo,
    ...demo2Incomes,
    ...demo2Expenses,
  ];
  await prisma.expense.createMany({ data: allPersonalExpenses });
  console.log(`✅ ${allPersonalExpenses.length} transacciones personales insertadas (${demo1Incomes.length + demo1ExpensesSept.length + demo1ExpensesAgo.length} Demo 1, ${demo2Incomes.length + demo2Expenses.length} Demo 2)`);

  // 7. Cargar Presupuestos para Septiembre 2026
  const budgetsData = [
    // Demo 1
    {
      categoryId: catMapDemo1.get('Supermercado & Alimentos'),
      amount: 260000.0,
      currency: 'ARS',
      month: 9,
      year: 2026,
      userId: DEMO_USER_ID,
    },
    {
      categoryId: catMapDemo1.get('Comida & Salidas'),
      amount: 80000.0,
      currency: 'ARS',
      month: 9,
      year: 2026,
      userId: DEMO_USER_ID,
    },
    {
      categoryId: catMapDemo1.get('Transporte & Combustible'),
      amount: 75000.0,
      currency: 'ARS',
      month: 9,
      year: 2026,
      userId: DEMO_USER_ID,
    },
    {
      categoryId: catMapDemo1.get('Salud & Farmacia'),
      amount: 60000.0,
      currency: 'ARS',
      month: 9,
      year: 2026,
      userId: DEMO_USER_ID,
    },
    {
      categoryId: catMapDemo1.get('Entretenimiento & Ocio'),
      amount: 40000.0,
      currency: 'ARS',
      month: 9,
      year: 2026,
      userId: DEMO_USER_ID,
    },
    {
      categoryId: catMapDemo1.get('Vivienda & Servicios'),
      amount: 500000.0,
      currency: 'ARS',
      month: 9,
      year: 2026,
      userId: DEMO_USER_ID,
    },
    // Demo 2 (Flor Demo)
    {
      categoryId: catMapDemo2.get('Supermercado & Alimentos'),
      amount: 220000.0,
      currency: 'ARS',
      month: 9,
      year: 2026,
      userId: DEMO2_USER_ID,
    },
    {
      categoryId: catMapDemo2.get('Salud & Farmacia'),
      amount: 70000.0,
      currency: 'ARS',
      month: 9,
      year: 2026,
      userId: DEMO2_USER_ID,
    },
    {
      categoryId: catMapDemo2.get('Compras & Ropa'),
      amount: 100000.0,
      currency: 'ARS',
      month: 9,
      year: 2026,
      userId: DEMO2_USER_ID,
    },
  ].filter((b) => Boolean(b.categoryId));

  await prisma.budget.createMany({ data: budgetsData });
  console.log(`✅ ${budgetsData.length} presupuestos configurados`);

  // 8. Cargar Suscripciones y Pagos Recurrentes
  const recurringData = [
    {
      name: 'Alquiler Palermo Soho',
      amount: 380000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 2,
      nextDueDate: new Date('2026-10-02T10:00:00Z'),
      autoDebit: true,
      isActive: true,
      categoryId: catMapDemo1.get('Vivienda & Servicios') || null,
      userId: DEMO_USER_ID,
    },
    {
      name: 'Expensas Edificio',
      amount: 65000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 5,
      nextDueDate: new Date('2026-10-05T10:00:00Z'),
      autoDebit: true,
      isActive: true,
      categoryId: catMapDemo1.get('Vivienda & Servicios') || null,
      userId: DEMO_USER_ID,
    },
    {
      name: 'Gimnasio Megatlon',
      amount: 32000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 10,
      nextDueDate: new Date('2026-10-10T10:00:00Z'),
      autoDebit: true,
      isActive: true,
      categoryId: catMapDemo1.get('Salud & Farmacia') || null,
      userId: DEMO_USER_ID,
    },
    {
      name: 'Internet Fibra 500MB Personal',
      amount: 24500.0,
      currency: 'ARS',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 15,
      nextDueDate: new Date('2026-10-15T10:00:00Z'),
      autoDebit: true,
      isActive: true,
      categoryId: catMapDemo1.get('Servicios & Facturas') || null,
      userId: DEMO_USER_ID,
    },
    {
      name: 'GitHub Copilot & Claude Team',
      amount: 30.0,
      currency: 'USD',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 20,
      nextDueDate: new Date('2026-09-20T10:00:00Z'),
      autoDebit: true,
      isActive: true,
      categoryId: catMapDemo1.get('Educación & Cursos') || null,
      userId: DEMO_USER_ID,
    },
    {
      name: 'Netflix Premium 4K',
      amount: 9800.0,
      currency: 'ARS',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 22,
      nextDueDate: new Date('2026-09-22T10:00:00Z'),
      autoDebit: true,
      isActive: true,
      categoryId: catMapDemo1.get('Servicios & Facturas') || null,
      userId: DEMO_USER_ID,
    },
    {
      name: 'Spotify Plan Familiar',
      amount: 4500.0,
      currency: 'ARS',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 25,
      nextDueDate: new Date('2026-09-25T10:00:00Z'),
      autoDebit: true,
      isActive: true,
      categoryId: catMapDemo1.get('Servicios & Facturas') || null,
      userId: DEMO_USER_ID,
    },
    {
      name: 'Seguro Automotor La Segunda',
      amount: 46000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 28,
      nextDueDate: new Date('2026-09-28T10:00:00Z'),
      autoDebit: true,
      isActive: true,
      categoryId: catMapDemo1.get('Transporte & Combustible') || null,
      userId: DEMO_USER_ID,
    },
    // Recurrentes para Demo 2
    {
      name: 'Estudio de Yoga & Pilates',
      amount: 32000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 8,
      nextDueDate: new Date('2026-10-08T10:00:00Z'),
      autoDebit: true,
      isActive: true,
      categoryId: catMapDemo2.get('Salud & Farmacia') || null,
      userId: DEMO2_USER_ID,
    },
    {
      name: 'Figma Professional & Notion AI',
      amount: 25.0,
      currency: 'USD',
      type: 'EXPENSE',
      frequency: 'MONTHLY',
      dayOfMonth: 18,
      nextDueDate: new Date('2026-10-18T10:00:00Z'),
      autoDebit: true,
      isActive: true,
      categoryId: catMapDemo2.get('Educación & Cursos') || null,
      userId: DEMO2_USER_ID,
    },
  ];

  await prisma.recurringTransaction.createMany({ data: recurringData });
  console.log(`✅ ${recurringData.length} transacciones recurrentes creadas`);

  // 9. Cargar 4 Bóvedas Compartidas entre Demo 1 y Demo 2 (Ticket SEI-67)
  console.log(`🏰 Sembrando 4 bóvedas compartidas entre Demo 1 y Demo 2...`);

  // Bóveda 1: 'Viaje Bariloche 2026'
  const vault1 = await prisma.vault.create({
    data: {
      name: 'Viaje Bariloche 2026',
      description: 'Aéreos, hotel Llao Llao, pases de esquí Cerro Catedral y chocolates.',
      ownerId: DEMO_USER_ID,
      members: {
        create: [
          { userId: DEMO_USER_ID, role: 'OWNER' },
          { userId: DEMO2_USER_ID, role: 'ADMIN' },
        ],
      },
    },
  });

  // Bóveda 2: 'Gastos de la Casa'
  const vault2 = await prisma.vault.create({
    data: {
      name: 'Gastos de la Casa',
      description: 'Gastos compartidos del hogar, alquiler, expensas, internet y supermercado.',
      ownerId: DEMO2_USER_ID,
      members: {
        create: [
          { userId: DEMO2_USER_ID, role: 'OWNER' },
          { userId: DEMO_USER_ID, role: 'ADMIN' },
        ],
      },
    },
  });

  // Bóveda 3: 'Salidas & Amigos'
  const vault3 = await prisma.vault.create({
    data: {
      name: 'Salidas & Amigos',
      description: 'Cenas, bares, asados grupales, cumpleaños y recitales.',
      ownerId: DEMO_USER_ID,
      members: {
        create: [
          { userId: DEMO_USER_ID, role: 'OWNER' },
          { userId: DEMO2_USER_ID, role: 'MEMBER' },
        ],
      },
    },
  });

  // Bóveda 4: 'Proyectos Compartidos'
  const vault4 = await prisma.vault.create({
    data: {
      name: 'Proyectos Compartidos',
      description: 'Inversiones y gastos en emprendimientos conjuntos y equipamiento de trabajo.',
      ownerId: DEMO2_USER_ID,
      members: {
        create: [
          { userId: DEMO2_USER_ID, role: 'OWNER' },
          { userId: DEMO_USER_ID, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log(`✅ 4 Bóvedas creadas con membresía mutua entre Demo 1 y Demo 2.`);

  // 10. Cargar Gastos en las Bóvedas Compartidas para ambos usuarios
  const vaultExpenses = [
    // Bóveda 1: 'Viaje Bariloche 2026'
    {
      vaultId: vault1.id,
      userId: DEMO_USER_ID,
      amount: 320000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Pasajes de avión Flybondi (Ida y Vuelta para 2)',
      date: new Date('2026-08-15T11:00:00Z'),
      categoryId: catMapDemo1.get('Viajes & Vacaciones') || null,
      tags: ['#bariloche', '#vuelos'],
    },
    {
      vaultId: vault1.id,
      userId: DEMO2_USER_ID,
      amount: 450000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Reserva Hotel Llao Llao / Cabaña 6 noches',
      date: new Date('2026-08-18T15:30:00Z'),
      categoryId: catMapDemo2.get('Viajes & Vacaciones') || null,
      tags: ['#bariloche', '#hospedaje'],
    },
    {
      vaultId: vault1.id,
      userId: DEMO_USER_ID,
      amount: 210000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Pases de Esquí y Alquiler de Equipos Catedral',
      date: new Date('2026-08-22T10:00:00Z'),
      categoryId: catMapDemo1.get('Entretenimiento & Ocio') || null,
      tags: ['#esqui', '#nieve'],
    },
    {
      vaultId: vault1.id,
      userId: DEMO2_USER_ID,
      amount: 165000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Alquiler Camioneta 4x4 Hertz por 5 días',
      date: new Date('2026-08-23T12:00:00Z'),
      categoryId: catMapDemo2.get('Transporte & Combustible') || null,
      tags: ['#alquilerauto'],
    },
    {
      vaultId: vault1.id,
      userId: DEMO_USER_ID,
      amount: 58000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Cena de bienvenida truchas y fondue en La Fondue',
      date: new Date('2026-08-24T21:00:00Z'),
      categoryId: catMapDemo1.get('Comida & Salidas') || null,
      tags: ['#cena', '#bariloche'],
    },
    {
      vaultId: vault1.id,
      userId: DEMO2_USER_ID,
      amount: 38500.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Chocolates Rapanui y Mamuschka recuerdos',
      date: new Date('2026-08-28T17:00:00Z'),
      categoryId: catMapDemo2.get('Comida & Salidas') || null,
      tags: ['#chocolates'],
    },

    // Bóveda 2: 'Gastos de la Casa'
    {
      vaultId: vault2.id,
      userId: DEMO_USER_ID,
      amount: 185000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Compra mensual Mayorista Makro alimentos y limpieza',
      date: new Date('2026-09-02T16:00:00Z'),
      categoryId: catMapDemo1.get('Supermercado & Alimentos') || null,
      tags: ['#hogar', '#supermercado'],
    },
    {
      vaultId: vault2.id,
      userId: DEMO2_USER_ID,
      amount: 88000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Expensas comunes departamento Palermo',
      date: new Date('2026-09-05T10:30:00Z'),
      categoryId: catMapDemo2.get('Vivienda & Servicios') || null,
      tags: ['#expensas'],
    },
    {
      vaultId: vault2.id,
      userId: DEMO_USER_ID,
      amount: 42300.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Facturas Luz Edenor & Metrogas hogar',
      date: new Date('2026-09-08T11:45:00Z'),
      categoryId: catMapDemo1.get('Servicios & Facturas') || null,
      tags: ['#servicios'],
    },
    {
      vaultId: vault2.id,
      userId: DEMO2_USER_ID,
      amount: 28500.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Internet Fibra Óptica Personal 600MB',
      date: new Date('2026-09-12T14:00:00Z'),
      categoryId: catMapDemo2.get('Servicios & Facturas') || null,
      tags: ['#internet'],
    },
    {
      vaultId: vault2.id,
      userId: DEMO2_USER_ID,
      amount: 34000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Artículos de bazar y plantas para el balcón en Easy',
      date: new Date('2026-09-15T18:00:00Z'),
      categoryId: catMapDemo2.get('Supermercado & Alimentos') || null,
      tags: ['#deco'],
    },
    {
      vaultId: vault2.id,
      userId: DEMO_USER_ID,
      amount: 25000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Reparación de plomería y canilla cocina',
      date: new Date('2026-09-18T10:00:00Z'),
      categoryId: catMapDemo1.get('Vivienda & Servicios') || null,
      tags: ['#mantenimiento'],
    },

    // Bóveda 3: 'Salidas & Amigos'
    {
      vaultId: vault3.id,
      userId: DEMO_USER_ID,
      amount: 72000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Asado con amigos sábado (Carne, Carbón y Picada)',
      date: new Date('2026-09-06T20:30:00Z'),
      categoryId: catMapDemo1.get('Comida & Salidas') || null,
      tags: ['#asado', '#amigos'],
    },
    {
      vaultId: vault3.id,
      userId: DEMO2_USER_ID,
      amount: 48000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Vinos Reserva Malbec & Cervezas artesanales',
      date: new Date('2026-09-06T21:00:00Z'),
      categoryId: catMapDemo2.get('Comida & Salidas') || null,
      tags: ['#bebidas'],
    },
    {
      vaultId: vault3.id,
      userId: DEMO_USER_ID,
      amount: 110000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Entradas Recital Movistar Arena (2 entradas campo)',
      date: new Date('2026-09-13T19:00:00Z'),
      categoryId: catMapDemo1.get('Entretenimiento & Ocio') || null,
      tags: ['#recital'],
    },
    {
      vaultId: vault3.id,
      userId: DEMO2_USER_ID,
      amount: 44000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Cocktails & Tapas en Cochinchina Bar',
      date: new Date('2026-09-17T23:00:00Z'),
      categoryId: catMapDemo2.get('Comida & Salidas') || null,
      tags: ['#cocktails'],
    },
    {
      vaultId: vault3.id,
      userId: DEMO_USER_ID,
      amount: 29000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Pizzas estilo napolitano & Cervezas post-cine',
      date: new Date('2026-09-19T22:30:00Z'),
      categoryId: catMapDemo1.get('Comida & Salidas') || null,
      tags: ['#pizza'],
    },

    // Bóveda 4: 'Proyectos Compartidos'
    {
      vaultId: vault4.id,
      userId: DEMO_USER_ID,
      amount: 75000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Suscripción anual Vercel Pro & Dominio .app',
      date: new Date('2026-09-01T12:00:00Z'),
      categoryId: catMapDemo1.get('Educación & Cursos') || null,
      tags: ['#infra', '#saas'],
    },
    {
      vaultId: vault4.id,
      userId: DEMO2_USER_ID,
      amount: 68000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Licencias Figma Organization & Adobe CC',
      date: new Date('2026-09-03T14:00:00Z'),
      categoryId: catMapDemo2.get('Educación & Cursos') || null,
      tags: ['#design', '#figma'],
    },
    {
      vaultId: vault4.id,
      userId: DEMO_USER_ID,
      amount: 240000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Monitor Dell UltraSharp 27" 4K para oficina',
      date: new Date('2026-09-10T16:00:00Z'),
      categoryId: catMapDemo1.get('Compras & Ropa') || null,
      tags: ['#hardware'],
    },
    {
      vaultId: vault4.id,
      userId: DEMO2_USER_ID,
      amount: 175000.0,
      currency: 'ARS',
      type: 'EXPENSE',
      description: 'Silla Ergonómica Grupo A2 X5 para coworking',
      date: new Date('2026-09-14T17:30:00Z'),
      categoryId: catMapDemo2.get('Compras & Ropa') || null,
      tags: ['#oficina'],
    },
  ];

  await prisma.expense.createMany({ data: vaultExpenses });
  console.log(`✅ ${vaultExpenses.length} transacciones distribuidas en las 4 bóvedas compartidas`);

  console.log('🎉 Carga de datos mock finalizada exitosamente en Neon PostgreSQL.');
  console.log(`   - Demo 1: ${DEMO_EMAIL} (5 activos, presupuestos, gastos personales y 4 bóvedas)`);
  console.log(`   - Demo 2: ${DEMO2_EMAIL} (4 activos, presupuestos, gastos personales y 4 bóvedas)`);
  console.log(`   - Bóvedas compartidas: 'Viaje Bariloche 2026', 'Gastos de la Casa', 'Salidas & Amigos', 'Proyectos Compartidos'`);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeder demo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
