# Gut Glu Backend

A minimal, production-shaped REST API boilerplate: NestJS, Prisma ORM, PostgreSQL,
JWT auth (access + refresh), role-based guards, Swagger docs, and a repository
layer that keeps Prisma out of your services.

## Structure

```
src/
├── main.ts                 # bootstrap: helmet, CORS, validation, swagger
├── app.module.ts
├── config/                 # env validation (Joi)
├── prisma/                 # global PrismaService/PrismaModule
├── common/
│   ├── decorators/         # @Roles, @CurrentUser
│   ├── guards/              # JwtAuthGuard, RolesGuard
│   └── filters/             # Prisma error -> HTTP error mapping
└── modules/
    ├── auth/                # login, refresh, JWT strategy
    └── users/                # CRUD, repository pattern
prisma/
├── schema.prisma
└── seed.ts
```

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the env file and set `DATABASE_URL` to your Postgres instance —
   either a local install or a live/hosted one (Supabase, Neon, RDS, Railway, etc.):
   ```bash
   cp .env.example .env
   ```
   The only requirement is that the database in the URL already exists — Prisma
   creates the tables, not the database itself. Create it first if needed:
   ```bash
   # local install, via psql
   createdb nest_prisma_db
   # or: psql -U postgres -c "CREATE DATABASE nest_prisma_db;"
   ```
   For a live/hosted DB, just paste the connection string the provider gives you
   into `DATABASE_URL` (they usually already include the database name).
3. Run migrations and generate the client:
   ```bash
   npm run prisma:migrate
   ```
4. (Optional) Seed an admin user (`admin@example.com` / `Passw0rd!`):
   ```bash
   npm run prisma:seed
   ```
5. Start the API:
   ```bash
   npm run start:dev
   ```

API: `http://localhost:3000/api`
Swagger: `http://localhost:3000/api/docs`

## Auth flow

- `POST /api/auth/login` → `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` → `{ accessToken }`
- Send `Authorization: Bearer <accessToken>` on protected routes.
- `POST /api/users` is public (registration). Admin-only routes are guarded with `@Roles(Role.ADMIN)`.

## Extending

- Add a new feature: create a `modules/<name>/` folder with the same
  `module / controller / service / repository / dto` shape as `users/`.
- Add a new Prisma model in `prisma/schema.prisma`, then run
  `npm run prisma:migrate` to create the migration.
- Prisma error codes (e.g. `P2002` unique constraint) are translated to proper
  HTTP responses in `common/filters/prisma-exception.filter.ts` — extend that
  switch as you hit new cases.
