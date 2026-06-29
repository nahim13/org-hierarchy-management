# Organizational Hierarchy Management — API

NestJS + PostgreSQL + TypeORM REST API for managing a company's reporting structure. Positions form a tree with a single root (the CEO). The API handles all tree operations — creation, reparenting, deletion, and traversal — while keeping the hierarchy valid at all times.

## How the tree works

Positions are stored as a plain adjacency list (`parent_id` column). There is no closure table or TypeORM `@Tree()` decorator — subtree and ancestor traversals are done with hand-written `WITH RECURSIVE` CTEs in `PositionsRepository`.

A few key behaviors to be aware of:

**Reparenting** — moving a position to a new parent is allowed as long as the new parent is not within the position's own subtree. The cycle check fetches the full descendant set via the recursive CTE and rejects the move if the proposed parent appears in it.

**Deletion** — deleting a position reassigns its direct children to its own parent (one level up), so no subtree is ever orphaned. The root position cannot be deleted; attempting to do so returns `409 Conflict`. Rows are soft-deleted (`deleted_at`) rather than removed.

**Depth** — a `level` column is denormalized onto each row and kept up to date on every create, reparent, and delete. Reads never need to walk the tree to know a position's depth.

## Architecture

```
Controller → Service → Repository → Entity / DTO
```

- `positions.controller.ts` — HTTP routing and Swagger decorators, nothing else.
- `positions.service.ts` — all business logic: tree assembly, cycle prevention, deletion policy, level recalculation.
- `positions.repository.ts` — the only file that talks to TypeORM directly; owns the `WITH RECURSIVE` SQL.
- `position.entity.ts` / `dto/*` — data shape and input validation via `class-validator`, enforced globally by `ValidationPipe`.
- `common/filters/http-exception.filter.ts` — unified JSON error response shape.
- `common/interceptors/logging.interceptor.ts` — request/response logging.

## Endpoints

| Method | Path                       | Description                                  |
| ------ | -------------------------- | -------------------------------------------- |
| POST   | `/positions`               | Create a new position                        |
| GET    | `/positions`               | List all positions (supports `?search=name`) |
| GET    | `/positions/tree`          | Full org chart as a nested hierarchy         |
| GET    | `/positions/:id`           | Single position detail                       |
| GET    | `/positions/:id/children`  | Direct children only (flat list)             |
| GET    | `/positions/:id/ancestors` | Reporting line from this position up to CEO  |
| PUT    | `/positions/:id`           | Update name or parent (reparent)             |
| DELETE | `/positions/:id`           | Delete; children are reassigned one level up |

Interactive docs available at `http://localhost:3000/api` (Swagger UI).

## Running locally

```bash
npm install
cp .env.example .env    # edit to point at your Postgres instance
npm run start:dev
```

No Postgres? Spin one up with the included Compose file:

```bash
docker compose up -d
```

The defaults in `.env.example` match the Compose configuration, so no changes needed for local development.

## Tests

```bash
npm test
```

Unit tests cover controller routing (service is mocked) and the core service logic: cycle prevention, the reassign-on-delete behavior, and the root-deletion guard.

## Out of scope

The following were intentionally deferred in favor of getting the core tree right first: audit log, Redis caching, drag-and-drop reparenting, chart-library rendering, bulk-upload endpoints, and role-based access control.
