'use client';

import type { Position } from '@/types/position';

interface DeleteConfirmDialogProps {
  position: Position;
  parentName: string | null;
  childCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting?: boolean;
  error?: string | null;
}

export function DeleteConfirmDialog({
  position,
  parentName,
  childCount,
  onConfirm,
  onCancel,
  isDeleting,
  error,
}: DeleteConfirmDialogProps) {
  const isRoot = position.parentId === null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-white p-5 shadow-card">
        <h2 className="text-sm font-semibold text-ink">
          Delete &ldquo;{position.name}&rdquo;?
        </h2>

        {isRoot ? (
          <p className="mt-2 text-sm text-ink/70">
            This is the root position. The API will refuse this — there's no
            parent to promote its reports to, and the org must always have
            exactly one root.
          </p>
        ) : childCount > 0 ? (
          <p className="mt-2 text-sm text-ink/70">
            {childCount} direct report{childCount === 1 ? '' : 's'} will be
            reassigned to{' '}
            <span className="font-medium text-ink">
              {parentName ?? 'its parent'}
            </span>
            . The rest of the org chart stays intact. This position will be
            soft-deleted, not erased.
          </p>
        ) : (
          <p className="mt-2 text-sm text-ink/70">
            This position has no direct reports. It will be soft-deleted, not
            erased.
          </p>
        )}

        {error && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-medium text-ink/70 hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isRoot || isDeleting}
            className="focus-ring rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
