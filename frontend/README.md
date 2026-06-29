# Organizational Hierarchy Management — Frontend

Next.js UI for browsing and managing the org chart. It talks to the [backend API](../backend) via a typed fetch client and keeps data fresh with React Query.

## Features

- **Tree view** — an expandable, collapsible org chart that renders the full hierarchy. Built as a hand-rolled recursive component so every line of it is transparent and easy to follow.
- **Table view** — a flat, searchable list of all positions, useful when the tree is large.
- **Position detail** — click any node to view its full reporting line, direct reports, and metadata.
- **Create / edit** — a form (react-hook-form + zod) for creating new positions or updating an existing one, including reparenting.
- **Safe delete** — before confirming a deletion, the dialog tells you exactly which positions will be reassigned and to whom, matching what the API will actually do.

## Structure

```
src/
├── app/
│   ├── page.tsx                   # home: tree view with table toggle
│   └── positions/[id]/page.tsx    # position detail and edit
├── components/
│   ├── OrgTree.tsx                # recursive tree with expand/collapse
│   ├── PositionTable.tsx          # searchable flat list
│   ├── PositionForm.tsx           # create/edit form (react-hook-form + zod)
│   └── DeleteConfirmDialog.tsx    # reassignment warning before deletion
├── lib/api.ts                     # typed fetch client for the backend API
└── types/position.ts              # shared TypeScript types
```

## Running locally

```bash
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL if needed
npm run dev                         # → http://localhost:3001
```

The backend's CORS is pre-configured for `localhost:3001`, so no extra setup is needed for local development.

## A few things worth knowing

- **Cycle prevention is server-side.** The "Reports to" dropdown does not filter out a position's own descendants — the API enforces this and returns a clear error if a circular assignment is attempted, which the form surfaces to the user.
- **Deletion is non-destructive.** When you delete a position that has direct reports, the confirmation dialog explains that those reports will be moved up one level, not deleted. This mirrors the actual API behavior.
- **No charting library.** The tree is a hand-rolled recursive React component rather than react-d3-tree or React Flow. It covers all required functionality and keeps the dependency footprint minimal.
