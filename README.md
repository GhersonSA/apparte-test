# Apparte Test Técnico

Repositorio de la prueba técnica fullstack. La solución está organizada por casos para que la revisión sea rápida y trazable.

## Estructura

- `caso-1-multitenant/`
  - `backend/`: Node.js + Express + Prisma + PostgreSQL
  - `frontend/`: React + Vite + TailwindCSS
- `caso-2-konva/`
  - `frontend`: React + Konva (representacion visual interactiva)
- `docker-compose.yml`: orquestación local de base de datos, backend y frontend

## Documentación por caso

- Caso 1: `caso-1-multitenant/README.md`
- Caso 2: `caso-2-konva/README.md`

## Arranque local (en 1 minuto)

1. Iniciar Docker Desktop.
2. Desde la raíz del repositorio ejecutar:

```bash
docker compose up --build -d
```

3. En primer arranque (o tras reiniciar volumen), aplicar migraciones y seed:

```bash
docker compose exec backend npm run db:deploy
docker compose exec backend npm run db:seed
```

4. Abrir:

- Frontend: `http://localhost:5173`
- API health: `http://localhost:3001/api/health`

## Credenciales de prueba

- `tenantSlug`: `tenant-alpha`
- `email`: `admin@alpha.com`
- `password`: el valor de `SEED_DEFAULT_PASSWORD` en `.env`

## Parar servicios

```bash
docker compose down
```


