# Gestor Guita 💸

Gestor Guita es una aplicación moderna de finanzas personales, diseñada específicamente para resolver fricciones comunes en contextos de multi-moneda e impuestos locales (como en Argentina), permitiendo el ingreso de gastos en tiempo récord a través de IA y garantizando el funcionamiento sin conexión a internet.

## Características Principales ✨

- 🤖 **Ingreso Rápido con IA:** Dile al sistema en lenguaje natural qué gastaste (ej. *"Cargué nafta por 30 mil"* o *"Suscripción de Netflix por 15 USD"*) y el sistema autocompletará el formulario estructurado usando LLMs.
- 💵 **Motor Impositivo Multi-moneda:** Ingresa gastos en dólares u otras monedas; el backend aplicará automáticamente las reglas de conversión y las tasas impositivas correspondientes según la configuración local.
- 📶 **Offline-First:** Guarda tus gastos incluso cuando viajas en subte o no tienes red. La aplicación encola los registros localmente y los sincroniza en background al recuperar la conexión.
- 🔒 **Privacidad Total (RLS):** Tus datos financieros están seguros. La base de datos aplica políticas de Row Level Security (RLS) impidiendo fugas de datos entre usuarios, incluso a nivel de API.

## Arquitectura 🏗️

El proyecto está diseñado bajo una arquitectura de monorepo dividida en:
- **Frontend:** Next.js (App Router), Zustand (Estado/Cola Offline), Tailwind CSS, PWA setup.
- **Backend:** NestJS, TypeScript, Vercel AI SDK.
- **Infraestructura:** PostgreSQL y Supabase Auth, gestionados localmente vía Docker.

> Para más detalles, consulta el documento de [Arquitectura Completa](./docs/architecture.md).

## Requisitos Previos 📋

- [Node.js](https://nodejs.org/en/) (v18+)
- [Docker](https://www.docker.com/) y Docker Compose
- [Supabase CLI](https://supabase.com/docs/guides/cli) (opcional, recomendado)
- [pnpm](https://pnpm.io/) (como gestor de paquetes recomendado)

## Sprints y Roadmap 🗺️

El desarrollo del proyecto está organizado en 4 épicas principales:
1. **ÉPICA 1: Base y Acceso:** Setup Core, Docker, Auth (Supabase) y RLS.
2. **ÉPICA 2: El Corazón (Tracking Manual):** Categorías, CRUD de Gastos, Motor Impositivo.
3. **ÉPICA 3: Fricción Cero:** Integración LLM para parsing de lenguaje natural y UI Mágica.
4. **ÉPICA 4: Resiliencia y Datos:** Service Workers para offline, Background Sync, y Dashboards de análisis.
