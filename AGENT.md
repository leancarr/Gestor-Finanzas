# Memoria a Largo Plazo y Contexto del Proyecto: Gestor-Finanzas (Gestor Guita)

## 📌 Visión General
**Gestor Guita** es una aplicación de tracking financiero personal diseñada para contextos multi-moneda (con foco inicial en Argentina) y cargas ultra-rápidas mediante Inteligencia Artificial y soporte Offline-first (PWA).

---

## 🛠️ Stack Tecnológico

### 1. Monorepo y Herramientas
- **Gestor de Paquetes:** `pnpm` (Regla estricta: NUNCA usar `npm` ni `yarn`).
- **Orquestador de Build:** Turborepo (`turbo`).
- **Control de Versiones:** Git / GitHub.

### 2. Frontend (`apps/web`)
- **Framework:** Next.js 16 (App Router).
- **Librerías UI:** React 19, TailwindCSS v4, Lucide React / Shadcn UI.
- **Manejo de Estado:** Zustand + IndexedDB (para sincronización offline).
- **Formularios & Validación:** React Hook Form + Zod.
- **PWA:** Service Worker para interceptar peticiones offline.
- **Puerto de Desarrollo:** `3000` (configurable vía `PORT`).

### 3. Backend (`apps/api`)
- **Framework:** NestJS v12 con TypeScript (ESM).
- **ORM / Base de Datos:** Prisma ORM v6 con PostgreSQL.
- **IA / LLM:** Vercel AI SDK / OpenAI / Anthropic / Gemini.
- **Autenticación:** Supabase Auth + JWT validation con Row Level Security (RLS).
- **Endpoints Core:**
  - `GET /health`: Healthcheck que ejecuta ping a la base de datos PostgreSQL y mide latencia.
- **Puerto de Desarrollo:** `4001` (para evitar colisión con otros servicios locales).

### 4. Infraestructura & Base de Datos
- **Docker Compose:** `docker-compose.yml` en la raíz.
- **PostgreSQL:** `postgres:16-alpine` en puerto host `5433:5432` con volumen `postgres_data` y healthcheck nativo.

---

## 🚀 Comandos Rápidos del Monorepo

```bash
# Levantar base de datos Postgres en segundo plano
pnpm db:up
# o bien: docker compose up -d

# Detener base de datos
pnpm db:down

# Instalar todas las dependencias
pnpm install

# Correr todos los proyectos en desarrollo (Next.js + NestJS)
pnpm dev

# Compilar todo el monorepo
pnpm build

# Generar cliente de Prisma
pnpm --filter api run prisma:generate

# Sincronizar cambios de esquema a Postgres
pnpm --filter api run prisma:push
```

---

## 📋 Convenciones y Registro de Decisiones

1. **Gestión de Puertos:**
   - Para evitar conflictos con otros contenedores del entorno local:
     - Postgres expone el puerto `5433` mapeado al `5432` interno.
     - NestJS API corre en el puerto `4001`.
     - Next.js Web corre en el puerto `3000`.
2. **Prisma en pnpm Monorepo:**
   - La versión de Prisma está fijada en `6.4.1` tanto para `prisma` como `@prisma/client`.
   - Genera el cliente estándar y se importa directamente en `PrismaService`.
3. **Control de Errores y Healthcheck:**
   - El endpoint `/health` responde `200 OK` con `{ status: "ok", database: { status: "connected", latencyMs: ... } }` o `503 Service Unavailable` si la base de datos está inaccesible.

---

## 📝 Historial de Sprints / Tickets

- **Ticket 1.1 (SEI-18): Setup Core & Base de Datos** `[COMPLETADO]`
  - Estructura Monorepo pnpm workspaces + Turborepo.
  - App Frontend Next.js 16 (`apps/web`).
  - App Backend NestJS v12 (`apps/api`).
  - `docker-compose.yml` para PostgreSQL en puerto 5433 con healthcheck.
  - Prisma 6 configurado y sincronizado con PostgreSQL.
  - Endpoint `/health` operativo con verificación de base de datos en tiempo real.

- **Ticket 1.2 (SEI-19): Autenticación y Perfil (Supabase Auth + SSR + NestJS Guard)** `[COMPLETADO]`
  - Frontend (`apps/web`): Instalación de `@supabase/ssr` y `@supabase/supabase-js`.
  - Configuración de clientes browser (`client.ts`), server (`server.ts`), cookie session refresh en `middleware.ts` y callback route handler (`/auth/callback`).
  - Componentes de UI: `<LoginButton />`, `<LogoutButton />`, `<UserStatus />` con diseño responsivo y modo oscuro.
  - Página `/auth` interactiva con manejo de estado de sesión, Sign In / Sign Up con correo y contraseña, y soporte para proveedores OAuth.
  - Backend (`apps/api`): `AuthModule` con `SupabaseStrategy` (Passport JWT), `SupabaseAuthGuard` con soporte de decorador `@Public()`, decorador `@CurrentUser()`, servicio de sincronización automática de usuarios a PostgreSQL vía Prisma, y endpoints `GET /auth/me` y `GET /auth/status`.
  - Placeholders de configuración en `.env`, `.env.example`, `apps/web/.env.example` y `apps/api/.env.example`.

- **Ticket 1.3 (SEI-20): Seguridad de Datos (Row Level Security - RLS)** `[COMPLETADO]`
  - Migración Prisma `20260901023542_enable_rls` con creación de roles (`anon`, `authenticated`, `service_role`), esquema y funciones `auth.uid()` / `auth.role()`.
  - Habilitación de `ENABLE ROW LEVEL SECURITY` y `FORCE ROW LEVEL SECURITY` en tablas `users`, `categories`, `expenses` y `HealthCheck`.
  - Políticas RLS granulares para operaciones CRUD (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) vinculadas a `(SELECT auth.uid()) = id` / `user_id` para el rol `authenticated`, y bypass completo para `service_role`.
  - Actualización de `PrismaService` en NestJS (`apps/api`) con métodos transaccionales seguros:
    - `withUser(userId, callback)`: Ejecuta `SET LOCAL ROLE authenticated;` y `SELECT set_config('request.jwt.claim.sub', userId, true), set_config('app.current_user_id', userId, true)`.
    - `withRole(role, userId, callback)` y `forUser(userOrId, callback)`.
  - Actualización de `AuthService.syncOrCreateUser` para ejecutar las mutaciones bajo el contexto `withUser(authUser.id)`.
  - Suite de pruebas completa: 8 pruebas unitarias y 5 pruebas de integración / E2E (`test/rls.e2e-spec.ts`) validando aislamiento de tenants, bloqueo de cross-tenant inserts y rechazo de accesos no autorizados.

- **Ticket 2.1 (SEI-21): Gestión de Categorías** `[COMPLETADO]`
  - **Backend (`apps/api`):**
    - `CategoriesModule`, `CategoriesController` y `CategoriesService` con endpoints protegidos (`GET /categories`, `GET /categories/:id`, `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id`, `POST /categories/seed-defaults`).
    - Protección obligatoria con `SupabaseAuthGuard` e inyección de contexto RLS mediante `prisma.withUser(userId)`.
    - DTOs con validación estricta (`CreateCategoryDto`, `UpdateCategoryDto`) y activación global de `ValidationPipe`.
    - Sincronización automática de 12 categorías predeterminadas con íconos y colores adaptadas al contexto financiero personal en `AuthService.syncOrCreateUser`.
    - Suite de pruebas unitarias (`categories.service.spec.ts`, `categories.controller.spec.ts`): 19 pruebas añadidas (totalizando 27 pruebas unitarias + 5 pruebas E2E 100% exitosas).
  - **Frontend (`apps/web`):**
    - Módulo `/categorias` con panel interactivo, métricas de categorías en tiempo real, búsqueda y filtros.
    - Modal de creación y edición integrado con `react-hook-form` y validación tipada con `zod`.
    - Selector visual de más de 40 íconos `lucide-react` agrupados por rubros y paleta de colores personalizada con vista previa en vivo.
    - Modal de confirmación de eliminación segura con control de impacto sobre gastos asociados.
    - Cliente API desacoplado (`utils/api/categories.ts`) con envío automático de tokens JWT de Supabase Auth.
    - Navegación integrada en la barra principal del Home.

- **Ticket 2.2 (SEI-22): Ingreso de Gasto Básico** `[COMPLETADO]`
  - **Backend (`apps/api`):**
    - `ExpensesModule`, `ExpensesController` y `ExpensesService` con endpoints protegidos (`POST /expenses`, `GET /expenses`, `GET /expenses/:id`, `PATCH /expenses/:id`, `DELETE /expenses/:id`).
    - Protección obligatoria con `SupabaseAuthGuard` e inyección de contexto RLS (`prisma.withUser(userId)`).
    - DTOs con validación estricta (`CreateExpenseDto`, `UpdateExpenseDto`, `QueryExpenseDto`).
    - Verificación de pertenencia de categoría al usuario antes de asociar un gasto.
    - Soporte numérico simple para moneda local en pesos (`ARS`).
    - Suite de pruebas unitarias (`expenses.service.spec.ts`, `expenses.controller.spec.ts`): 18 pruebas nuevas (totalizando 45 pruebas unitarias 100% exitosas).
  - **Frontend (`apps/web`):**
    - Componente `<ExpenseForm />` construido con `react-hook-form` y `zod`, selector de categorías con vista previa de íconos Lucide y colores, atajos de importes rápidos en pesos y selector de fechas.
    - Vista `/gastos/nuevo` optimizada para registro ágil de consumos.
    - Vista `/gastos` con métricas financieras en tiempo real (Total Gastado en ARS, Cantidad de Gastos, Gasto Promedio, Mayor Gasto), filtros combinados por búsqueda y categoría, lista de tarjetas `<ExpenseCard />` y confirmación de borrado `<ExpenseDeleteModal />`.
    - Cliente API desacoplado (`utils/api/expenses.ts`) con integración de JWT de sesión de Supabase Auth.
    - Integración de accesos directos y banners en la página principal (`/`).

- **Ticket 2.3 (SEI-23): Historial y Gestión de Gastos** `[COMPLETADO]`
  - Feed cronológico de gastos con filtros avanzados por fecha y categoría.
  - Edición y eliminación con control de permisos RLS.
  - Gráficos analíticos integrados con Recharts.

- **Ticket 2.4 (SEI-24): Motor Impositivo (Backend)** `[COMPLETADO]`
  - Módulo `apps/api/src/taxes/` con servicio `TaxesService` y controlador `TaxesController`.
  - Matriz de cálculo impositivo para Argentina (IVA 21%, Impuesto PAÍS / Percepciones 30%, operaciones exentas / crypto 0%).
  - DTO `CalculateTaxDto` y endpoints protegidos `POST /taxes/calculate` y `GET /taxes/rates`.
  - Precisión matemática y redondeo financiero con `Number.EPSILON`.
  - 29 pruebas unitarias dedicadas (100% exitosas).

- **Ticket 3.3 / SEI-33: Multimoneda y Crypto (Conversión Automática)** `[COMPLETADO]`
  - Módulo `apps/api/src/rates/` con servicio `RatesService` y controlador `RatesController`.
  - Integración en tiempo real con DolarApi (Oficial, Blue, MEP, Tarjeta, EUR) y CryptoYa (USDT/ARS).
  - Caché en memoria con TTL de 5 minutos y fallback estático de alta resiliencia.
  - Endpoints `GET /rates` y `POST /rates/convert` para conversiones precisas cruzadas.
  - 22 pruebas unitarias dedicadas (100% exitosas).

- **Ticket 2.5 (SEI-25): UI de Impuestos y Multi-moneda** `[COMPLETADO]`
  - Componente `<CurrencySelector />` con diseño glassmorphism y selección de ARS, USD, EUR, USDT con badges y cotización en vivo.
  - Componente `<TaxBreakdownPreview />` con desglose pormenorizado de alícuotas (Servicios Digitales 59%, IVA 21%, Tarjeta 60%, IVA Reducido 10.5%).
  - Integración en `<ExpenseForm />` y `<ExpenseCard />` con badges y conversión a pesos.
  - Filtro por moneda en `/gastos`.

- **Ticket 3.1 & 3.2 (SEI-26, SEI-27): Magic Input con Gemini AI** `[COMPLETADO]`
  - Endpoint `POST /expenses/ai-parse` con Vercel AI SDK / Google GenAI.
  - Componente `<MagicInput />` en la pantalla principal para registrar gastos mediante lenguaje natural con previsualización en modal interactivo.

- **Ticket 4.1 & 4.2 (SEI-28, SEI-29): Offline First & Sincronización Automática** `[COMPLETADO]`
  - PWA con service worker (`next-pwa`).
  - Encolado de peticiones en IndexedDB cuando se pierde conexión a red.
  - `<SyncManager />` para sincronización automática en background al recuperar conectividad y badges de estado.

- **Ticket SEI-31: Refactorización UI Glassmorphism y Hardening de Seguridad** `[COMPLETADO]`
  - Protección con `helmet`, CORS configurable y `@nestjs/throttler` (rate limiting 100 req/min).
  - Paleta premium modo oscuro (`#050505`) con acentos esmeralda (`#10b981`), bordes sutiles y desenfoques `backdrop-blur-md`.

- **Ticket SEI-32: Exportación de Datos (PDF/CSV)** `[COMPLETADO]`
  - Componente `<ExportMenu />` para descarga de balances y movimientos en PDF o CSV.

- **Ticket SEI-30: Tableros Analíticos (Backend)** `[COMPLETADO]`
  - Endpoint `GET /expenses/analytics` con validación DTO `QueryAnalyticsDto` (`range`: `'7d' | '30d' | 'month'`, `currency`).
  - Lógica analítica bajo contexto RLS (`prisma.withUser(userId)`).
  - Cálculo de serie continua `timeline` agrupada por día con balance diario.
  - KPIs actuales (`totalExpenses`, `totalIncome`, `netBalance`, `averageExpensePerDay`, `transactionCount`), KPIs del período equivalente previo y variaciones porcentuales blindadas contra división por cero.
  - Ranking de distribución por categoría con cálculo porcentual y orden descendente.
  - Suite de pruebas unitarias completa con 120/120 tests aprobados en `apps/api`.

- **Ticket SEI-34: Gestión Avanzada de Perfil (Settings & GDPR) (Backend)** `[COMPLETADO]`
  - Prisma: campo `avatarUrl String? @map("avatar_url")` añadido a `model User`.
  - Módulo `UsersModule` (`apps/api/src/users/`):
    - `UpdateProfileDto` con validaciones de `class-validator`.
    - `UsersService` con aislamiento transaccional RLS (`prisma.withUser(userId)`).
    - `UsersController` con endpoints protegidos por `SupabaseAuthGuard`:
      - `GET /users/me`: Perfil con `{ id, email, name, avatarUrl, createdAt }`.
      - `PATCH /users/profile`: Modificación de nombre y avatarUrl.
      - `DELETE /users/me`: Borrado permanente GDPR eliminando transaccionalmente gastos, categorías y usuario.
    - Registro de `UsersModule` en `apps/api/src/app.module.ts`.
    - 12 pruebas unitarias dedicadas en `users.service.spec.ts` y `users.controller.spec.ts` (100% pasando). Total suite: 132/132 pruebas exitosas.

- **Ticket SEI-36: Gastos Recurrentes y Suscripciones Automáticas (Backend y Frontend)** `[COMPLETADO]`
  - **Backend (`apps/api/src/recurring`):**
    - DTOs `CreateRecurringDto` y `UpdateRecurringDto` con validaciones estrictas.
    - `RecurringService`: Aislamiento transaccional RLS (`prisma.withUser(userId)`), cálculo de fechas `calculateNextDueDate`, generación de `Expense` manual (`process`) o en lote para débitos vencidos (`processDue`).
    - `RecurringController`: Endpoints protegidos por `SupabaseAuthGuard` (`GET /recurring`, `GET /recurring/:id`, `POST /recurring`, `PATCH /recurring/:id`, `DELETE /recurring/:id`, `POST /recurring/:id/process`, `POST /recurring/process-due`).
    - Registro de `RecurringModule` en `apps/api/src/app.module.ts`.
    - 32 pruebas unitarias dedicadas en `recurring.service.spec.ts` y `recurring.controller.spec.ts` (100% pasando). Suite completa: 164/164 pruebas exitosas en 16 test suites.
  - **Frontend (`apps/web`):**
    - Cliente API `utils/api/recurring.ts` integrado con Supabase Auth JWT.
    - Componente `<RecurringCard />` con badge de cuenta regresiva de vencimiento, frecuencia, toggle rápido de débito automático y botón "Registrar ahora".
    - Modal interactivo `<RecurringFormModal />` con presets de servicios populares (Spotify, Netflix, YouTube, ChatGPT, etc.) y selector de monedas/categorías.
    - Modal de confirmación `<RecurringDeleteModal />`.
    - Vista `/suscripciones` con métricas KPI (Total Mensual Comprometido, Suscripciones Activas, Próximo Vencimiento, En Débito Automático), botón de cobro en lote de débitos vencidos, filtros por estado y catálogo responsivo.
    - Componente `<UpcomingDuesWidget />` en el Dashboard principal que alerta si hay vencimientos en los próximos 5 días con botón rápido de cobro.
    - Enlaces de navegación a `/suscripciones` incorporados en el header de todas las pantallas (`/`, `/gastos`, `/categorias`, `/analiticas`, `/perfil`).
    - Verificaciones de TypeScript (`tsc --noEmit`) y ESLint 100% exitosas sin errores.

- **Ticket SEI-35: Presupuestos y Metas por Categoría (Backend y Frontend)** `[COMPLETADO]`
  - **Backend (`apps/api/src/budgets`):**
    - DTOs `CreateBudgetDto` (`categoryId`, `amount`, `month`, `year`, `currency`), `UpdateBudgetDto`, `QueryBudgetDto` con validaciones de `class-validator` y transformaciones de `class-transformer`.
    - `BudgetsService`: Aislamiento transaccional RLS (`prisma.withUser(userId)`), cálculo cruzado de gastos acumulados del período para cada categoría sin problemas de N+1 queries, cálculo centralizado de estado (`OK` < 80%, `WARNING` 80-100%, `EXCEEDED` > 100%), porcentaje de consumo y saldo disponible/excedente.
    - `BudgetsController`: Endpoints protegidos por `SupabaseAuthGuard` (`GET /budgets?month=...&year=...`, `GET /budgets/:id`, `POST /budgets`, `PATCH /budgets/:id`, `DELETE /budgets/:id`).
    - Registro de `BudgetsModule` en `apps/api/src/app.module.ts`.
    - 25 pruebas unitarias dedicadas en `budgets.service.spec.ts` y `budgets.controller.spec.ts` (100% pasando). Suite completa del backend: 189/189 pruebas unitarias exitosas en 17 suites.
  - **Frontend (`apps/web`):**
    - Cliente API `utils/api/budgets.ts` integrado con Supabase Auth JWT.
    - Componente `<BudgetCard />` con barra visual de consumo dinámico y código cromático (verde <80%, ámbar 80-100%, rojo pulsante >100%), % gastado, badge de alerta/estado, y montos formateados.
    - Componente modal interactivo `<BudgetModal />` para fijar y editar topes mensuales con atajos rápidos de incremento (+$10k, +$50k, +$100k, +$250k) y selector multi-moneda.
    - Vista `/presupuestos` con navegador interactivo de mes/año, resumen total presupuestado vs gastado (4 KPIs: Total Presupuestado, Gastado Real, Disponible/Exceso, Nivel de Consumo Global), empty states y modal de borrado seguro.
    - Enlace a `/presupuestos` incorporado en la barra de navegación de todas las pantallas (`/`, `/gastos`, `/categorias`, `/suscripciones`, `/analiticas`, `/perfil`).
- **Ticket SEI-37: Bóvedas Compartidas (Modo Pareja/Familia) (Backend y Frontend)** `[COMPLETADO]`
  - **Backend (`apps/api/src/vaults`):**
    - Modelos `Vault`, `VaultMember` y enum `VaultRole` en Prisma schema con cascade deletes y relaciones a `User`, `Expense` y `Category`.
    - DTOs `CreateVaultDto`, `UpdateVaultDto`, `AddMemberDto`, `UpdateMemberRoleDto` con validaciones de `class-validator`.
    - `VaultsService` con aislamiento transaccional RLS (`prisma.withUser(userId)`), validaciones de permisos (OWNER/ADMIN), gestión de miembros y algoritmo de liquidación de deudas (`getBalances`).
    - `VaultsController` con 9 endpoints REST protegidos por `SupabaseAuthGuard` (`POST /vaults`, `GET /vaults`, `GET /vaults/:id`, `PATCH /vaults/:id`, `DELETE /vaults/:id`, `POST /vaults/:id/members`, `DELETE /vaults/:id/members/:memberUserId`, `PATCH /vaults/:id/members/:memberUserId`, `GET /vaults/:id/balances`).
    - 48 pruebas unitarias dedicadas en `vaults.service.spec.ts` y `vaults.controller.spec.ts` (100% pasando). Suite completa del backend: 238/238 tests aprobados en 19 test suites.
  - **Frontend (`apps/web`):**
    - Cliente API `utils/api/vaults.ts` con tipos TypeScript (`VaultRole`, `VaultMember`, `Vault`, `MemberContribution`, `Settlement`, `VaultBalances`), integración de Supabase Auth JWT y fallback offline/mock en `localStorage`.
    - Store reactivo `stores/useVaultStore.ts` con soporte SSR (`useSyncExternalStore`), sincronización transparente en `localStorage` y métodos `activeVault`, `activeVaultId`, `setActiveVault`, `clearActiveVault`.
    - Componente selector de workspace `<VaultSelector />` integrado en el header con dropdown glassmorphism, indicador de contexto personal/compartido y badge de estado.
    - Componente tarjeta `<VaultCard />` con diseño glassmorphism, avatar stacks apilados, roles cromáticos (`OWNER`, `ADMIN`, `MEMBER`, `VIEWER`), contador de transacciones y botones de activación rápida.
    - Modal `<CreateVaultModal />` con presets inteligentes (Casa & Pareja 🏡, Familia 👨‍👩‍👦, Vacaciones 🌴, Roomies 🏢) y soporte para edición.
    - Modal `<VaultMembersModal />` para gestión completa de integrantes, invitación por correo con selector de rol y expulsión segura.
    - Widget visual `<VaultBalancesWidget />` con total acumulado de gastos grupales, cálculo de cuota justa (`fairShare`), barras de progreso proporcionales y flujo interactivo de liquidaciones ("X le debe $Y a Z") con botón "Marcar como Saldado".
    - Vista completa `/bovedas` con navegación por pestañas ("Mis Bóvedas" y "Saldos y Balances Compartidos"), KPIs grupales y empty state inspirador.
    - Integración de `<VaultSelector />` y acceso `/bovedas` en la navegación de todas las pantallas (`/`, `/gastos`, `/gastos/nuevo`, `/presupuestos`, `/suscripciones`, `/categorias`, `/analiticas`, `/perfil`).
    - Verificaciones de calidad: 100% aprobado en TypeScript `tsc --noEmit` (0 errores) y ESLint (0 errores en archivos de bóvedas).

- **Épica 2: IA y Visión (SEI-38 y SEI-39) (Backend y Frontend)** `[COMPLETADO]`
  - **Backend (`apps/api/src/ai`):**
    - DTOs con `class-validator` y `class-transformer`: `ParseReceiptDto` (`imageBase64`, `mimeType`) y `ChatMessageDto` (`message`, `history` tipado como `ChatHistoryItemDto`).
    - `AiService`:
      - **SEI-38 (`parseReceipt`):** Limpieza de Data URL/Base64, detección inteligente de `mimeType`, extracción de categorías del usuario, esquema estructurado con `@google/genai` (`Type.OBJECT`) para `merchant`, `total`, `currency`, `date`, `categoryId`, `items`, `taxAmount`, prompt especializado en comprobantes fiscales AFIP y comercios locales, y fallback resiliente.
      - **SEI-39 (`chatFinancialAdvisor`):** Extracción de contexto financiero bajo RLS (`prisma.withUser(userId)`) de gastos recientes (últimos 30 días), balance del mes actual (gastos vs ingresos), estado de presupuestos activos (% de consumo y alertas de sobregasto) y suscripciones/débitos automáticos. Generación de respuesta con agente "GuitaBot" en tono empático y rioplatense sutil, retornando respuesta y `contextSummary` (`totalSpentMonth`, `totalIncomeMonth`, `activeBudgetsCount`).
    - `AiController`: Endpoints protegidos con `SupabaseAuthGuard` y `@CurrentUser()`:
      - `POST /ai/receipt`: Análisis de tickets y facturas con Vision AI.
      - `POST /ai/chat`: Conversación interactiva con el contador de bolsillo (GuitaBot).
    - Registro de `AiModule` en `apps/api/src/app.module.ts`.
    - 11 pruebas unitarias dedicadas en `ai.service.spec.ts` y `ai.controller.spec.ts` (100% pasando). Suite completa del backend: 249/249 tests aprobados en 21 test suites. Build de NestJS (`pnpm --filter api build`) y `oxlint` 100% exitosos sin errores ni advertencias.
  - **Frontend (`apps/web`):**
    - Cliente API `utils/api/ai.ts` con tipos TypeScript (`ReceiptItem`, `ParsedReceipt`, `ChatMessage`, `ChatResponse`), integración de Supabase Auth JWT y fallback inteligente para Vision AI y Chatbot.
    - Componente `<ReceiptScannerModal />`: Modal interactivo con Glassmorphism, drag-and-drop de imágenes, captura directa desde cámara web/celular (`getUserMedia`), animación de haz láser (`laserScan` en `globals.css`), formulario con datos extraídos editables, tabla colapsable de ítems detectados y botón "Confirmar y Crear Gasto" integrado con `createExpense`.
    - Integración de escáner en UI: botón con ícono `ScanLine` ("Escanear Ticket") incorporado en la barra de `<MagicInput />` del Dashboard y en `/gastos` junto a "+ Nueva Transacción".
    - Componente `<FinancialChatbot />`: Botón flotante FAB en la esquina inferior derecha (`fixed bottom-6 right-6 z-40`) con halo de pulso esmeralda y tooltip "Contador de Bolsillo". Drawer lateral desplegable con avatar, estado "En línea", historial con burbujas diferenciadas, chips de preguntas rápidas, animación de escribiendo y formateador markdown integrado (listas, negritas, cursivas, código).
    - Vista dedicada `/asistente` (`apps/web/src/app/asistente/page.tsx`): Pantalla completa para sesiones de asesoramiento extendidas, con 4 tarjetas de KPIs contextuales (Gasto acumulado, Margen presupuestario, Tasa de ahorro, Salud financiera) y chat central amplio.
    - Integración de navegación: `<FinancialChatbot />` montado globalmente en `layout.tsx` y enlaces al "Asistente" con ícono `Bot` en la cabecera de todas las vistas (`/`, `/gastos`, `/bovedas`, `/presupuestos`, `/suscripciones`, `/categorias`, `/analiticas`, `/perfil`).
    - Verificaciones de calidad: TypeScript `tsc --noEmit` aprobado con 0 errores y ESLint 100% limpio (0 errores, 0 warnings).

- **Ticket SEI-40: Modo Inversiones / Portafolio de Patrimonio 📈 (Backend)** `[COMPLETADO]`
  - **Prisma Schema (`apps/api/prisma/schema.prisma`):**
    - Enum `AssetType` (`CASH_ARS`, `CASH_USD`, `FIXED_TERM`, `CEDEAR`, `CRYPTO`, `OTHER`).
    - Model `Asset`: campos `id`, `name`, `type`, `ticker`, `quantity` (Decimal 18,8), `purchasePrice` (Decimal 18,4), `currentPrice` (Decimal 18,4), `currency`, `institution`, `dueDate`, `interestRate` (Decimal 5,2), `notes`, relación con `User` con cascada en borrado y mapeo a tabla `assets`.
    - Relación `assets Asset[]` agregada en `model User`.
    - Generación exitosa de cliente Prisma con `pnpm --filter api run prisma:generate`.
  - **Módulo de Inversiones (`apps/api/src/investments`):**
    - DTOs `CreateAssetDto`, `UpdateAssetDto`, `QueryAssetDto` con validaciones estrictas (`class-validator` y `class-transformer`).
    - Tipos de datos `PortfolioSummary`, `AssetDistribution` y `AppliedRates` en `investments.interface.ts`.
    - `InvestmentsService`:
      - Aislamiento transaccional RLS (`prisma.withUser(userId)`).
      - Métodos CRUD completos (`create`, `findAll`, `findOne`, `update`, `remove`).
      - Motor de valuación multimoneda (`calculateAssetValuation`): soporte para cotizaciones Dólar Blue, Oficial, MEP, USDT y EUR; cálculo 1:1 para efectivo; cálculo de intereses acumulados y proyectados al vencimiento para plazos fijos (`FIXED_TERM`) en base a TNA y días transcurridos/pactados.
      - `getPortfolioSummary`: cálculo de Net Worth en ARS y USD, Total Invertido, Ganancia/Pérdida (P&L) en monto y porcentaje, distribución porcentual por clase de activo y snapshot de cotizaciones.
    - `InvestmentsController`: Endpoints REST protegidos por `SupabaseAuthGuard` y `@CurrentUser()` (`POST /investments`, `GET /investments`, `GET /investments/summary`, `GET /investments/:id`, `PATCH /investments/:id`, `DELETE /investments/:id`).
    - Registro de `InvestmentsModule` en `apps/api/src/app.module.ts`.
    - 28 pruebas unitarias añadidas en `investments.service.spec.ts` y `investments.controller.spec.ts`.
    - Suite de backend completa: **277 / 277 tests unitarios aprobados (100% de éxito en 23 suites)**.
    - Calidad verificada: Linter `oxlint` 0 errores/warnings y `nest build` compilado con éxito.
