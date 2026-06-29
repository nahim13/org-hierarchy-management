'use client';

import Link from 'next/link';
import type { Position } from '@/types/position';

interface PositionTableProps {
  positions: Position[];
  search: string;
  onSearchChange: (value: string) => void;
  onDelete: (position: Position) => void;
  isLoading?: boolean;
}

export function PositionTable({
  positions,
  search,
  onSearchChange,
  onDelete,
  isLoading,
}: PositionTableProps) {
  const byId = new Map(positions.map((p) => [p.id, p]));

  return (
    <div>
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search by name…"
        className="focus-ring mb-3 w-full max-w-sm rounded-md border border-line bg-white px-3 py-2 text-sm placeholder:text-ink/40"
      />

      <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line bg-surface text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-3 py-2.5 font-medium">Name</th>
              <th className="px-3 py-2.5 font-medium">Department</th>
              <th className="px-3 py-2.5 font-medium">Level</th>
              <th className="px-3 py-2.5 font-medium">Reports to</th>
              <th className="px-3 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody>
            {!isLoading && positions.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-ink/40">
                  No positions match “{search}”.
                </td>
              </tr>
            )}
            {positions.map((position) => (
              <tr
                key={position.id}
                className="border-b border-line last:border-none hover:bg-surface/60"
              >
                <td className="px-3 py-2.5">
                  <Link
                    href={`/positions/${position.id}`}
                    className="font-medium text-ink hover:text-accent"
                  >
                    {position.name}
                  </Link>
                </td>
                <td className="px-3 py-2.5 text-ink/60">
                  {position.department ?? '—'}
                </td>
                <td className="px-3 py-2.5 font-mono text-ink/60">
                  {position.level}
                </td>
                <td className="px-3 py-2.5 text-ink/60">
                  {position.parentId
                    ? byId.get(position.parentId)?.name ?? '—'
                    : 'Root'}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    onClick={() => onDelete(position)}
                    className="focus-ring rounded-md px-2 py-1 text-xs font-medium text-ink/50 hover:text-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
