# Organizational Hierarchy Management — Full Stack

`backend/` (NestJS + PostgreSQL + TypeORM) + `frontend/` (Next.js).
Built against `PROJECT_PLAN.md` (the de-conflicted final plan included
in this repo as `PROJECT_PLAN.pdf`).

## Quick start

```bash
# 1. Database
cd backend && docker compose up -d        # or point .env at your own Postgres

# 2. API
cd backend
npm install
cp .env.example .env
npm run start:dev                          # http://localhost:3000, docs at /api

# 3. Frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                                # http://localhost:3001
```

Open `http://localhost:3001`, create a root position (e.g. "CEO"), and
build the tree out from there.

## What was fixed against the uploaded scaffold

The uploaded `perago-nestjs-api` repo had drifted from the plan in
several ways. Corrected here:

1. **`PositionsRepository` existed but was never used.** The service
   called TypeORM's `Repository<PositionEntity>` directly, bypassing
   the Controller → Service → Repository layering the plan requires
   and leaving the hand-written recursive-CTE methods
   (`findDescendants`, `findAncestors`) dead code. The service is now
   built on `PositionsRepository`.
2. **Deletion did a hard delete with no reassignment** —
   `positionsRepository.remove(position)`, no children handling, no
   root protection. This directly contradicted the plan's resolved
   decision. Replaced with: reassign direct children to the deleted
   node's parent → recompute their subtree levels → soft delete the
   row. Deleting the root now throws `409 Conflict`.
3. **Cycle prevention walked ancestors by hand** instead of using the
   recursive-CTE descendant query the plan calls out specifically
   ("the goal is to explain a `WITH RECURSIVE` SQL statement you wrote
   yourself"). Reparenting now checks the new parent against
   `findDescendants()`.
4. **`level` was declared but never maintained.** Now set on create
   (`parent.level + 1`) and recalculated through the subtree on every
   reparent or delete-and-reassign.
5. **Update endpoint used `PATCH`; the plan specifies `PUT`.** Fixed.
6. **`GET /positions/:id/ancestors` (the reporting-line breadcrumb)
   didn't exist**, despite being a named endpoint in the plan. Added.
7. **`GET /positions/:id/children` returned a nested subtree**, not
   "direct children only" as specified. Fixed to return a flat list of
   immediate children.
8. **Hardcoded DB credentials in `app.module.ts`**, despite the plan
   explicitly requiring env-based config "replacing the scaffold's
   hardcoded credentials." Switched to `ConfigModule` +
   `TypeOrmModule.forRootAsync`.
9. **No global `ValidationPipe` or registered exception filter** —
   both existed as building blocks (`class-validator` DTOs,
   `HttpExceptionFilter`) but were never wired up in `main.ts`. Fixed,
   and added a logging interceptor (present in the plan's folder
   structure but missing from the code).
10. **Leftover scaffold entities** (`UserEntity`, `PhotoEntity`,
    `AppController` "Hello World") were never cleaned up, despite Day 1
    of the plan calling for "scaffold cleanup." Removed; the root
    controller now exposes a minimal health check.
11. **No service-level tests** for cycle prevention, reassign-on-delete,
    or "cannot delete root" — the exact logic the plan flags as most
    likely to be probed. Added `positions.service.spec.ts`.
12. **No frontend existed at all.** Built per the plan's exact file
    list: a hand-rolled recursive `OrgTree`, a searchable
    `PositionTable`, `PositionForm` (react-hook-form + zod),
    `DeleteConfirmDialog`, a typed `lib/api.ts`, and the two pages
    (`app/page.tsx`, `app/positions/[id]/page.tsx`), wired to the API
    with React Query.

See `backend/README.md` and `frontend/README.md` for the per-app
details, and `PROJECT_PLAN.pdf` for the original reasoning this build
follows.
