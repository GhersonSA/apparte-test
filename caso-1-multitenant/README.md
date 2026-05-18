# Caso 1 - Aplicación web multi-tenant con formulario en dos pasos

Este caso implementa una solución fullstack sencilla, con foco en dos puntos clave:

1. Aislamiento multi-tenant real (no solo por convención en código).
2. Flujo de formulario en dos pasos, persistido vía API REST.

## Stack técnico

- Frontend: React + Vite + TailwindCSS
- Backend: Node.js + Express + TypeScript
- Base de datos: PostgreSQL
- ORM: Prisma
- Autenticación: JWT (Bearer token)

## Alcance implementado

- Login y sesión de usuario
- Autorización básica por rol (`USER`, `ADMIN`)
- Soporte multi-tenant con aislamiento de datos
- Formulario en dos pasos:
  - Paso 1: `firstName`, `lastName`, `location`
  - Paso 2: `interventionType`
- Persistencia en PostgreSQL asociando cada registro a `user` y `tenant`

## Estructura del caso

```text
caso-1-multitenant/
├─ backend/
│  ├─ prisma/
│  ├─ src/
│  │  ├─ config/
│  │  ├─ middlewares/
│  │  ├─ modules/
│  │  │  ├─ auth/
│  │  │  └─ reports/
│  │  └─ shared/
│  └─ Dockerfile
└─ frontend/
   ├─ src/
   │  ├─ api/
   │  ├─ components/
   │  ├─ context/
   │  ├─ hooks/
   │  ├─ pages/
   │  └─ types/
   └─ Dockerfile
```

## Ejecución local

Desde la raíz del repositorio:

1. Levantar servicios:

```bash
docker compose up --build -d
```

2. Aplicar migraciones y seed de prueba:

```bash
docker compose exec backend npm run db:deploy
docker compose exec backend npm run db:seed
```

3. Acceder a la aplicación:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`
- Health: `GET /api/health`

4. Parar servicios:

```bash
docker compose down
```

## Variables de entorno

Archivo `.env` en raíz (ver `.env.example`):

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_PORT` (host por defecto `5433`)
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PASSWORD_SALT_ROUNDS`
- `SEED_DEFAULT_PASSWORD`

Referencia backend:

- `caso-1-multitenant/backend/.env.example`

## Modelo de datos

### Tablas

- `tenants`
  - `id` (PK)
  - `name`
  - `slug` (único)

- `users`
  - `id` (PK)
  - `email`
  - `password_hash`
  - `role` (`USER` o `ADMIN`)
  - `tenant_id` (FK -> `tenants.id`)

- `accident_reports`
  - `id` (PK)
  - `first_name`
  - `last_name`
  - `location`
  - `intervention_type`
  - `user_id` (FK -> `users.id`)
  - `tenant_id` (FK -> `tenants.id`)

### Relaciones

- Un tenant tiene muchos usuarios.
- Un tenant tiene muchos reportes.
- Un usuario puede crear muchos reportes.

## Endpoints implementados

### Autenticación

- `POST /api/auth/login`
  - body: `{ tenantSlug, email, password }`
  - response: `{ token, tenant, user }`

- `GET /api/auth/me`
  - headers: `Authorization: Bearer <token>`
  - response: `{ user }`

- `POST /api/auth/register`
  - headers: `Authorization: Bearer <token>`
  - rol requerido: `ADMIN`
  - body: `{ email, password, role? }`

### Reportes (formulario)

Todos requieren:

- `Authorization: Bearer <token>`

Endpoints:

- `POST /api/reports`
  - body: `{ firstName, lastName, location, interventionType }`

- `GET /api/reports`
  - listado tenant-scoped

- `GET /api/reports/:id`
  - detalle tenant-scoped

- `GET /api/reports/stats`
  - total y agregados por tipo de intervención

- `DELETE /api/reports/:id`
  - permitido para propietario o admin

## Cómo se garantiza el aislamiento multi-tenant

El aislamiento está implementado en dos capas, de forma intencionadamente redundante:

1. Capa aplicación
- El JWT incluye `tenantId`.
- Cada operación de datos tenant-scoped se ejecuta dentro de `withTenantContext(...)`.
- Dentro de esa transacción se fija `app.current_tenant` con:
  - `set_config('app.current_tenant', <tenantId>, true)`

2. Capa base de datos
- RLS habilitado y forzado en `users` y `accident_reports`.
- Políticas RLS que solo permiten filas donde:
  - `tenant_id = current_setting('app.current_tenant', true)`

Resultado: aunque una consulta se escriba sin filtro explícito por tenant, PostgreSQL sigue aplicando el aislamiento.

## Datos de prueba

El seed crea dos tenants y usuarios para cada tenant.

Login de referencia:

- `tenantSlug`: `tenant-alpha`
- `email`: `admin@tenant-alpha.com`
- `password`: valor de `SEED_DEFAULT_PASSWORD`

