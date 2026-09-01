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


