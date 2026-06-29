# Organizational Hierarchy Management

A full-stack application for managing a company's reporting structure. Positions are organized as a tree rooted at a single CEO node — you can create, move, and delete positions while the tree always stays consistent.

The stack is a NestJS + PostgreSQL API (`backend/`) paired with a Next.js frontend (`frontend/`).

## What it does

- Build and visualize your org chart as a live, expandable tree
- Create positions and assign them a parent ("Reports to")
- Move a position to a different manager — cycle prevention is enforced server-side
- Delete a position safely: its direct reports are automatically reassigned one level up rather than orphaned
- Search and browse all positions in a flat table view
- View any position's full reporting line up to the CEO

## Project structure

```
.
├── backend/    # NestJS REST API + PostgreSQL
└── frontend/   # Next.js UI
```

## Quick start

```bash
# 1. Start the database
cd backend && docker compose up -d

# 2. Start the API
cd backend
npm install
cp .env.example .env
npm run start:dev          # → http://localhost:3000  (Swagger at /api)

# 3. Start the frontend (new terminal)
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                # → http://localhost:3001
```

Open `http://localhost:3001`, create a root position (e.g. "CEO"), and build the tree from there.

See [`backend/README.md`](./backend/README.md) and [`frontend/README.md`](./frontend/README.md) for deeper detail on each app.
