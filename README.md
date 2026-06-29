# Organizational Hierarchy Management — Full Stack

`backend/` (NestJS + PostgreSQL + TypeORM) + `frontend/` (Next.js).


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



See `backend/README.md` and `frontend/README.md` for the per-app
details.
