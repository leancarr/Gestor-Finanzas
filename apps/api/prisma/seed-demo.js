import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DEMO_USER_ID = 'usr_85994edbd027068e';
const DEMO_EMAIL = 'demo@gestorguita.com';

async function main() {
  console.log(`🚀 Iniciando carga de datos mock para el usuario: ${DEMO_EMAIL} (${DEMO_USER_ID})...`);

  // Asegurar que el usuario existe en Neon
  await prisma.user.upsert({
    where: { id: DEMO_USER_ID },
    update: {
      email: DEMO_EMAIL,
      name: 'Usuario Demo',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    },
    create: {
      id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      name: 'Usuario Demo',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    },
  });

  // Ejecutar dentro del contexto RLS del usuario demo con timeout extendido
  await prisma.$transaction(
    async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL ROLE authenticated;`);
    await tx.$executeRaw`SELECT set_config('request.jwt.claim.sub', ${DEMO_USER_ID}, true), set_config('app.current_user_id', ${DEMO_USER_ID}, true)`;

    // Obtener categorías del usuario
    const categories = await tx.category.findMany({
      where: { userId: DEMO_USER_ID },
    });

    const catMap = new Map();
    categories.forEach((c) => catMap.set(c.name, c.id));

    console.log(`Categorías disponibles: ${categories.length}`);

    // Limpiar gastos, presupuestos y suscripciones previas del usuario demo para evitar duplicados
    await tx.expense.deleteMany({ where: { userId: DEMO_USER_ID } });
    await tx.budget.deleteMany({ where: { userId: DEMO_USER_ID } });
    await tx.recurringTransaction.deleteMany({ where: { userId: DEMO_USER_ID } });

    // 1. Cargar Ingresos (Septiembre y Agosto 2026)
    const incomeData = [
      {
        amount: 1850000.0,
        currency: 'ARS',
        type: 'INCOME',
        description: 'Sueldo Empresa Tech (Septiembre)',
        date: new Date('2026-09-01T10:00:00Z'),
        categoryId: catMap.get('Salario & Sueldo') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 450000.0,
        currency: 'ARS',
        type: 'INCOME',
        description: 'Proyecto Freelance UI/UX Mobile App',
        date: new Date('2026-09-10T15:30:00Z'),
        categoryId: catMap.get('Freelance & Ventas') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 72500.0,
        currency: 'ARS',
        type: 'INCOME',
        description: 'Rendimientos Fondos Comunes e Inversiones',
        date: new Date('2026-09-15T12:00:00Z'),
        categoryId: catMap.get('Inversiones & Ahorro') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 1750000.0,
        currency: 'ARS',
        type: 'INCOME',
        description: 'Sueldo Empresa Tech (Agosto)',
        date: new Date('2026-08-01T10:00:00Z'),
        categoryId: catMap.get('Salario & Sueldo') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 380000.0,
        currency: 'ARS',
        type: 'INCOME',
        description: 'Consultoría Arquitectura NestJS',
        date: new Date('2026-08-14T18:00:00Z'),
        categoryId: catMap.get('Freelance & Ventas') || null,
        userId: DEMO_USER_ID,
      },
    ];

    // 2. Cargar Gastos variados (Septiembre 2026)
    const expensesSept = [
      {
        amount: 380000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Alquiler Depto Palermo Soho',
        date: new Date('2026-09-02T11:00:00Z'),
        categoryId: catMap.get('Vivienda & Servicios') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 65000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Expensas Ordinarias Edificio',
        date: new Date('2026-09-03T14:20:00Z'),
        categoryId: catMap.get('Vivienda & Servicios') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 148500.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Compra Quincenal Coto Digital',
        date: new Date('2026-09-04T16:45:00Z'),
        categoryId: catMap.get('Supermercado & Alimentos') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 39500.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Combustible YPF Infinia (Tanque lleno)',
        date: new Date('2026-09-05T09:15:00Z'),
        categoryId: catMap.get('Transporte & Combustible') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 54000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Cena Asado en Don Julio con Amigos',
        date: new Date('2026-09-06T21:30:00Z'),
        categoryId: catMap.get('Comida & Salidas') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 19200.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Farmacia Farmacity remedios y botiquín',
        date: new Date('2026-09-07T12:10:00Z'),
        categoryId: catMap.get('Salud & Farmacia') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 14200.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Netflix Premium & Spotify Familiar',
        date: new Date('2026-09-08T08:00:00Z'),
        categoryId: catMap.get('Servicios & Facturas') || null,
        userId: DEMO_USER_ID,
        isTaxable: true,
      },
      {
        amount: 32000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Cuota Mensual Gimnasio Megatlon',
        date: new Date('2026-09-09T18:00:00Z'),
        categoryId: catMap.get('Salud & Farmacia') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 7800.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Café de Especialidad y Bakery en Cuervo',
        date: new Date('2026-09-11T17:00:00Z'),
        categoryId: catMap.get('Comida & Salidas') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 62400.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Reposición Alimentos y Limpieza en Jumbo',
        date: new Date('2026-09-12T13:30:00Z'),
        categoryId: catMap.get('Supermercado & Alimentos') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 21000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Entradas Cine IMAX & Combo Pochoclos',
        date: new Date('2026-09-13T20:00:00Z'),
        categoryId: catMap.get('Entretenimiento & Ocio') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 115000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Zapatillas Nike Air Running',
        date: new Date('2026-09-14T19:15:00Z'),
        categoryId: catMap.get('Compras & Ropa') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 36800.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Facturas Luz Edenor & Metrogas',
        date: new Date('2026-09-16T11:45:00Z'),
        categoryId: catMap.get('Servicios & Facturas') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 26500.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Delivery Sushi Premium Domicilio',
        date: new Date('2026-09-17T22:00:00Z'),
        categoryId: catMap.get('Comida & Salidas') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 40.0,
        currency: 'USD',
        type: 'EXPENSE',
        description: 'Suscripción Claude Team & ChatGPT Plus',
        date: new Date('2026-09-18T10:00:00Z'),
        categoryId: catMap.get('Educación & Cursos') || null,
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
        categoryId: catMap.get('Supermercado & Alimentos') || null,
        userId: DEMO_USER_ID,
      },
    ];

    // Gastos de Agosto 2026 (para KPIs comparativos mes a mes)
    const expensesAgo = [
      {
        amount: 380000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Alquiler Depto Palermo Soho',
        date: new Date('2026-08-02T11:00:00Z'),
        categoryId: catMap.get('Vivienda & Servicios') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 58000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Expensas Ordinarias Edificio',
        date: new Date('2026-08-03T14:20:00Z'),
        categoryId: catMap.get('Vivienda & Servicios') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 185000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Supermercado Coto del mes',
        date: new Date('2026-08-05T16:45:00Z'),
        categoryId: catMap.get('Supermercado & Alimentos') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 41000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Carga Combustible Shell V-Power',
        date: new Date('2026-08-10T09:15:00Z'),
        categoryId: catMap.get('Transporte & Combustible') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 48000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Salida Parrilla La Brigada San Telmo',
        date: new Date('2026-08-15T21:30:00Z'),
        categoryId: catMap.get('Comida & Salidas') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 32000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Gimnasio Megatlon cuota Agosto',
        date: new Date('2026-08-18T18:00:00Z'),
        categoryId: catMap.get('Salud & Farmacia') || null,
        userId: DEMO_USER_ID,
      },
      {
        amount: 82000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        description: 'Compras Ropa de Invierno Zara',
        date: new Date('2026-08-25T19:00:00Z'),
        categoryId: catMap.get('Compras & Ropa') || null,
        userId: DEMO_USER_ID,
      },
    ];

    const allExpenses = [...incomeData, ...expensesSept, ...expensesAgo];
    await tx.expense.createMany({ data: allExpenses });
    console.log(`✅ ${allExpenses.length} transacciones (ingresos y gastos) insertadas`);

    // 3. Cargar Presupuestos para Septiembre 2026
    const budgetsData = [
      {
        categoryId: catMap.get('Supermercado & Alimentos'),
        amount: 260000.0,
        currency: 'ARS',
        month: 9,
        year: 2026,
        userId: DEMO_USER_ID,
      },
      {
        categoryId: catMap.get('Comida & Salidas'),
        amount: 80000.0, // Gastado ~88.300 -> Estado: EXCEEDED
        currency: 'ARS',
        month: 9,
        year: 2026,
        userId: DEMO_USER_ID,
      },
      {
        categoryId: catMap.get('Transporte & Combustible'),
        amount: 75000.0, // Gastado ~39.500 -> Estado: OK
        currency: 'ARS',
        month: 9,
        year: 2026,
        userId: DEMO_USER_ID,
      },
      {
        categoryId: catMap.get('Salud & Farmacia'),
        amount: 60000.0, // Gastado ~51.200 -> Estado: WARNING (>80%)
        currency: 'ARS',
        month: 9,
        year: 2026,
        userId: DEMO_USER_ID,
      },
      {
        categoryId: catMap.get('Entretenimiento & Ocio'),
        amount: 40000.0, // Gastado ~21.000 -> Estado: OK
        currency: 'ARS',
        month: 9,
        year: 2026,
        userId: DEMO_USER_ID,
      },
      {
        categoryId: catMap.get('Vivienda & Servicios'),
        amount: 500000.0, // Gastado ~445.000 -> Estado: WARNING
        currency: 'ARS',
        month: 9,
        year: 2026,
        userId: DEMO_USER_ID,
      },
    ].filter((b) => Boolean(b.categoryId));

    await tx.budget.createMany({ data: budgetsData });
    console.log(`✅ ${budgetsData.length} presupuestos configurados`);

    // 4. Cargar Suscripciones y Pagos Recurrentes
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
        categoryId: catMap.get('Vivienda & Servicios') || null,
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
        categoryId: catMap.get('Vivienda & Servicios') || null,
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
        categoryId: catMap.get('Salud & Farmacia') || null,
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
        categoryId: catMap.get('Servicios & Facturas') || null,
        userId: DEMO_USER_ID,
      },
      {
        name: 'GitHub Copilot & Claude Team',
        amount: 30.0,
        currency: 'USD',
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        dayOfMonth: 20,
        nextDueDate: new Date('2026-09-20T10:00:00Z'), // ¡Mañana!
        autoDebit: true,
        isActive: true,
        categoryId: catMap.get('Educación & Cursos') || null,
        userId: DEMO_USER_ID,
      },
      {
        name: 'Netflix Premium 4K',
        amount: 9800.0,
        currency: 'ARS',
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        dayOfMonth: 22,
        nextDueDate: new Date('2026-09-22T10:00:00Z'), // En 3 días
        autoDebit: true,
        isActive: true,
        categoryId: catMap.get('Servicios & Facturas') || null,
        userId: DEMO_USER_ID,
      },
      {
        name: 'Spotify Plan Familiar',
        amount: 4500.0,
        currency: 'ARS',
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        dayOfMonth: 25,
        nextDueDate: new Date('2026-09-25T10:00:00Z'), // En 6 días
        autoDebit: true,
        isActive: true,
        categoryId: catMap.get('Servicios & Facturas') || null,
        userId: DEMO_USER_ID,
      },
      {
        name: 'Seguro Automotor La Segunda',
        amount: 46000.0,
        currency: 'ARS',
        type: 'EXPENSE',
        frequency: 'MONTHLY',
        dayOfMonth: 28,
        nextDueDate: new Date('2026-09-28T10:00:00Z'), // En 9 días
        autoDebit: true,
        isActive: true,
        categoryId: catMap.get('Transporte & Combustible') || null,
        userId: DEMO_USER_ID,
      },
    ];

    await tx.recurringTransaction.createMany({ data: recurringData });
    console.log(`✅ ${recurringData.length} transacciones recurrentes creadas`);
  },
  { timeout: 60000, maxWait: 15000 },
);

  console.log('🎉 Carga de datos mock finalizada exitosamente en Neon PostgreSQL.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seeder demo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
