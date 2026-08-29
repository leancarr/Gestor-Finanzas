# Arquitectura del Sistema: Gestor Guita

Este documento describe la arquitectura técnica, las decisiones de diseño y las tecnologías empleadas en la construcción de **Gestor Guita**, un sistema de tracking financiero personal optimizado para contextos multi-moneda (ej. Argentina) y cargas rápidas mediante Inteligencia Artificial.

## 1. Visión General (Stack Tecnológico)

El proyecto sigue una arquitectura de Monorepo con una separación clara entre el cliente (Frontend) y los servicios (Backend), apoyándose en herramientas modernas para garantizar escalabilidad, tipado estricto y excelente experiencia de desarrollo.

*   **Frontend:** Next.js (App Router), React, TailwindCSS, Zustand (Estado global / Cola offline).
*   **Backend:** NestJS, TypeScript, Vercel AI SDK (para parsing con LLMs).
*   **Base de Datos:** PostgreSQL (Relacional) administrado localmente con Docker.
*   **Autenticación y Seguridad:** Supabase Auth + Row Level Security (RLS).
*   **Infraestructura Local:** Docker Compose.

---

## 2. Diagrama de Arquitectura de Alto Nivel

```mermaid
graph TD;
    Client[Cliente / Navegador PWA] -->|HTTPS / REST| Next[Next.js Frontend];
    Client -->|Background Sync| Next;
    Next -->|API Calls (JWT)| Nest[NestJS Backend];
    Nest -->|Prisma / TypeORM| Postgres[(PostgreSQL)];
    Nest -->|Prompts| LLM[LLM API / OpenAI / Vercel AI SDK];
    Supabase[Supabase Auth] -->|Auth Tokens| Client;
    Supabase -->|Verify| Postgres;
```

---

## 3. Componentes Principales

### 3.1. Frontend (Next.js PWA)
El cliente está diseñado para ser una Progressive Web App (PWA) de tipo "Offline-First".
*   **Service Worker:** Intercepta peticiones de red. Si el usuario está offline, guarda las creaciones de gastos en una cola de IndexedDB.
*   **Zustand / IndexedDB:** Manejan el estado local de la cola de envíos pendientes.
*   **React Hook Form + Zod:** Validación robusta en el cliente antes de enviar datos al servidor.
*   **TailwindCSS + Shadcn/ui:** Sistema de diseño responsivo y accesible.

### 3.2. Backend (NestJS)
El corazón de la lógica de negocio. Expone una API RESTful y maneja la complejidad de las reglas impositivas y la IA.
*   **Módulo Impositivo:** Un servicio inyectable encargado de tomar un gasto en moneda extranjera, consultar (o recibir) el tipo de cambio, y aplicar los porcentajes correspondientes (PAIS, Ganancias, etc.) para devolver el costo real al frontend.
*   **Módulo de IA (Parsing):** Un controlador específico que recibe lenguaje natural (`"Gasté 20 lucas en super"`), hace un llamado al LLM mediante Vercel AI SDK, y transforma la respuesta en un JSON tipado alineado con las Categorías existentes del usuario.

### 3.3. Base de Datos (PostgreSQL + RLS)
La persistencia de datos utiliza PostgreSQL. La seguridad de los datos multitenant (múltiples usuarios en la misma DB) no depende únicamente de la lógica de la aplicación (NestJS), sino que se delega a la propia base de datos a través de **Row Level Security (RLS)** gestionado vía Supabase.
*   **RLS Policies:** Cada query debe enviar el JWT del usuario autenticado. Postgres filtra automáticamente las filas asegurando que `SELECT * FROM expenses` retorne SOLO los gastos donde `user_id = jwt.sub`.

---

## 4. Flujos Clave (Slices)

### Ingreso de Gasto Inteligente (IA)
1. El usuario escribe en la UI: `"Cena en Mc Donalds por 15.000"`.
2. El frontend envía el prompt a `/api/ai/parse`.
3. NestJS inyecta el contexto del usuario (sus IDs de categorías) al prompt del LLM.
4. El LLM responde con un JSON: `{ amount: 15000, currency: "ARS", categoryId: "uuid-comida" }`.
5. El frontend muestra una previsualización (Preview Card).
6. El usuario confirma. El frontend envía el POST final a `/api/expenses`.

### Sincronización Offline
1. El dispositivo pierde conexión.
2. El usuario carga un gasto. El Service Worker falla el request HTTP.
3. El frontend intercepta el fallo, guarda la mutación en `IndexedDB` y marca la fila con un icono de "Pendiente" en la UI.
4. Vuelve la conexión. Se dispara el evento de `online`.
5. Un Worker oculto procesa la cola local y envía los POST pendientes a NestJS.
6. Se actualiza la UI a "Sincronizado".
