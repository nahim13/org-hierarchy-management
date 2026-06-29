# Org Chart Frontend (Next.js)

Talks to the [backend API](../backend) at `NEXT_PUBLIC_API_URL`
(defaults to `http://localhost:3000`).

## Structure

```
src/
├── app/
│   ├── page.tsx                  # tree view (default), with table toggle
│   └── positions/[id]/page.tsx   # detail/edit
├── components/
│   ├── OrgTree.tsx                # recursive, hand-rolled tree (expand/collapse)
│   ├── PositionTable.tsx          # flat/searchable table view
│   ├── PositionForm.tsx           # create/edit, react-hook-form + zod
│   └── DeleteConfirmDialog.tsx    # warns "children will be reassigned to X"
├── lib/api.ts                     # typed fetch client
└── types/position.ts
```

Per the project plan, this is intentionally a hand-rolled recursive
component rather than a charting library (react-d3-tree / React Flow) -
functionally identical for the reviewer, zero integration risk, every
line explainable on the spot. A charting library remains a stretch goal
only.

Data fetching/caching uses React Query.

## Running locally

```bash
npm install
cp .env.local.example .env.local   # point at your running backend
npm run dev
```

Runs on `http://localhost:3001` by default (the backend's CORS is
already configured for that origin).

## Notes

- The "Reports to" dropdown does not pre-filter a node's own descendants
  client-side - the API is the source of truth for cycle prevention and
  will reject an invalid reparent with a clear error, which is surfaced
  in the form.
- Deleting a position with direct reports explains, before you confirm,
  that they'll be reassigned one level up rather than deleted - matching
  the backend's actual behavior.
