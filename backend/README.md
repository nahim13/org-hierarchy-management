# Organizational Hierarchy Management API

NestJS + PostgreSQL + TypeORM backend for managing a company's reporting
structure (positions, organized as a tree with a single root/CEO).

This implements the **Backend** half of the [Final Project Plan](../PROJECT_PLAN.md).
See that document for the full reasoning. Summary of the decisions baked
into this code:

- **Storage:** plain adjacency list (`positions.parent_id`), not
  TypeORM's `@Tree()` decorator and not a closure table. Subtree and
  ancestor lookups run a `WITH RECURSIVE` CTE written by hand in
  `PositionsRepository` (`findDescendants`, `findAncestors`). Fetching
  the whole tree is one flat `SELECT` plus an O(n) in-memory parent-map
  pass in `PositionsService.findTree`.
- **Cycle prevention:** before any reparent, `PositionsService` fetches
  the node's full descendant set (via the recursive CTE) and rejects
  the update if the proposed new parent is in it, or is the node itself.
- **Deletion policy:** deleting a position re-points its direct children
  to its own parent (one level up), preserving the rest of the tree.
  Deleting the root (CEO) is blocked with `409 Conflict` - there's no
  parent to promote children to. The row itself is soft-deleted
  (`deleted_at`), never hard-deleted.
- **Depth:** `level` is denormalized on the row and recalculated
  whenever a node (or an ancestor of it) is created, reparented, or
  deleted, so reads never need to walk the tree to know depth.

## Architecture

```
Controller -> Service -> Repository -> Entity/DTO
```

- `positions.controller.ts` - HTTP routes + Swagger decorators only.
- `positions.service.ts` - business rules: tree assembly, cycle
  prevention, deletion policy, level recalculation.
- `positions.repository.ts` - the only place that talks to TypeORM
  directly; owns the recursive CTE SQL.
- `position.entity.ts` / `dto/*` - the data shape and input validation
  (`class-validator`, enforced by a global `ValidationPipe`).
- `common/filters/http-exception.filter.ts` - one consistent JSON error
  shape for every thrown exception.
- `common/interceptors/logging.interceptor.ts` - request/response
  logging.

## API

| Method | Path                     | Purpose                                   |
| ------ | ------------------------ | ------------------------------------------ |
| POST   | `/positions`             | Create                                     |
| GET    | `/positions`             | Flat list, optional `?search=name`        |
| GET    | `/positions/tree`        | Full nested hierarchy                      |
| GET    | `/positions/:id`         | Single position detail                     |
| GET    | `/positions/:id/children`| Direct children only                       |
| GET    | `/positions/:id/ancestors`| Reporting line up to the CEO (breadcrumb) |
| PUT    | `/positions/:id`         | Update (including reparenting)             |
| DELETE | `/positions/:id`         | Delete (children reassigned to its parent) |

Swagger UI: `http://localhost:3000/api` once the server is running.

## Running locally

```bash
npm install
cp .env.example .env       # then point it at your Postgres instance
npm run start:dev
```

Don't have Postgres handy? `docker compose up -d` starts one with the
same defaults as `.env.example`.

## Tests

```bash
npm test
```

Covers controller routing (mocked service) and, more importantly, the
service-level logic most likely to come up in review: cycle prevention,
reassign-on-delete, and "cannot delete the root" (`positions.service.spec.ts`).

## What was deliberately left out

Per the plan: audit/history log, Redis caching, drag-and-drop reparenting,
chart-library tree rendering, department-filter/bulk-upload endpoints,
and role-based access control. All good ideas, all deferred so the
one-week budget went to the core tree + CRUD + tests first.
