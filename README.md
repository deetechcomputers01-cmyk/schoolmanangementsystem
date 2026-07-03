# school-ms

ScholarSphere Pro school management foundation built with Next.js 14 App Router, TypeScript, PostgreSQL, Prisma, Tailwind CSS, Zod, JWT cookie authentication, and offline-first PWA helpers.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and set `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.

   For local Docker PostgreSQL, use:

```bash
docker compose up -d
```

3. Generate Prisma and run the first migration:

```bash
npm run db:generate
npm run db:migrate -- --name init
```

4. Seed realistic school data:

```bash
npm run db:seed
```

5. Start development:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Test Accounts

All seed accounts use `Password123!`.

| Role | Email |
| --- | --- |
| Admin | `admin@scholarsphere.edu.gh` |
| Teacher | `teacher1@scholarsphere.edu.gh` |
| Teacher | `teacher2@scholarsphere.edu.gh` |
| Accountant | `accounts@scholarsphere.edu.gh` |

## Main Areas

- Authentication with JWT access and refresh tokens stored in secure HTTP-only cookies.
- Middleware protection for dashboard pages and non-auth API routes.
- Role-based write protection in service functions.
- Prisma models for users, students, guardians, staff, classes, subjects, attendance, grades, fees, payments, timetable slots, and audit logs.
- Reusable UI, layout, and module components.
- Offline queue for attendance and payment actions using IndexedDB.
- PWA manifest and service worker caching for important pages and static assets.

## Commands

```bash
npm run dev
npm run build
npm run lint
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Notes

The application is intentionally structured so pages fetch data, components render data, API routes validate and delegate, and business logic stays in `src/lib/services`. Database access is isolated in service or repository files.
