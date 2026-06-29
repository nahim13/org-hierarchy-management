'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, positionsApi } from '@/lib/api';
import { OrgTree } from '@/components/OrgTree';
import { PositionTable } from '@/components/PositionTable';
import { PositionForm, type PositionFormValues } from '@/components/PositionForm';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';
import type { Position, PositionTreeNode } from '@/types/position';

type View = 'tree' | 'table';
type CreateTarget = { parent: PositionTreeNode | null } | null;

export default function HomePage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>('tree');
  const [search, setSearch] = useState('');
  const [createTarget, setCreateTarget] = useState<CreateTarget>(null);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const treeQuery = useQuery({
    queryKey: ['positions', 'tree'],
    queryFn: positionsApi.tree,
  });

  const listQuery = useQuery({
    queryKey: ['positions', 'list', search],
    queryFn: () => positionsApi.list(search || undefined),
    enabled: view === 'table',
  });

  const allPositionsQuery = useQuery({
    queryKey: ['positions', 'list', ''],
    queryFn: () => positionsApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: positionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setCreateTarget(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: positionsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setDeleteTarget(null);
      setDeleteError(null);
    },
    onError: (error) => {
      setDeleteError(
        error instanceof ApiError ? error.message : 'Failed to delete.',
      );
    },
  });

  const allPositions = allPositionsQuery.data ?? [];
  const hasRoot = allPositions.some((p) => p.parentId === null);

  const childCount = useMemo(() => {
    if (!deleteTarget) return 0;
    return allPositions.filter((p) => p.parentId === deleteTarget.id).length;
  }, [allPositions, deleteTarget]);

  const parentNameForDelete = useMemo(() => {
    if (!deleteTarget?.parentId) return null;
    return allPositions.find((p) => p.id === deleteTarget.parentId)?.name ?? null;
  }, [allPositions, deleteTarget]);

  function handleCreateSubmit(values: PositionFormValues) {
    createMutation.mutate({
      name: values.name,
      description: values.description,
      department: values.department || null,
      parentId: createTarget?.parent
        ? createTarget.parent.id
        : values.parentId || null,
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">
            Organization hierarchy
          </h1>
          <p className="text-sm text-ink/50">
            {hasRoot
              ? `${allPositions.length} position${allPositions.length === 1 ? '' : 's'}`
              : 'No positions yet — create the root to get started.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-line bg-white p-0.5 text-sm">
            <button
              onClick={() => setView('tree')}
              className={`rounded px-3 py-1.5 font-medium ${
                view === 'tree' ? 'bg-accent-soft text-accent' : 'text-ink/50'
              }`}
            >
              Tree
            </button>
            <button
              onClick={() => setView('table')}
              className={`rounded px-3 py-1.5 font-medium ${
                view === 'table' ? 'bg-accent-soft text-accent' : 'text-ink/50'
              }`}
            >
              Table
            </button>
          </div>
          <button
            onClick={() => setCreateTarget({ parent: null })}
            className="focus-ring rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark"
          >
            {hasRoot ? '+ New position' : '+ Create root position'}
          </button>
        </div>
      </div>

      {view === 'tree' ? (
        treeQuery.isLoading ? (
          <p className="text-sm text-ink/50">Loading…</p>
        ) : treeQuery.data && treeQuery.data.length > 0 ? (
          <OrgTree
            nodes={treeQuery.data}
            onAddChild={(parent) => setCreateTarget({ parent })}
            onDelete={(node) =>
              setDeleteTarget(toPosition(node))
            }
          />
        ) : (
          <EmptyState onCreate={() => setCreateTarget({ parent: null })} />
        )
      ) : (
        <PositionTable
          positions={listQuery.data ?? []}
          search={search}
          onSearchChange={setSearch}
          onDelete={setDeleteTarget}
          isLoading={listQuery.isLoading}
        />
      )}

      {createTarget && (
        <Modal onClose={() => setCreateTarget(null)}>
          <PositionForm
            mode="create"
            parentOptions={allPositions}
            lockedParentName={createTarget.parent?.name}
            onSubmit={handleCreateSubmit}
            onCancel={() => setCreateTarget(null)}
            submitting={createMutation.isPending}
            serverError={
              createMutation.error instanceof ApiError
                ? createMutation.error.message
                : null
            }
          />
        </Modal>
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          position={deleteTarget}
          parentName={parentNameForDelete}
          childCount={childCount}
          onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          onCancel={() => {
            setDeleteTarget(null);
            setDeleteError(null);
          }}
          isDeleting={deleteMutation.isPending}
          error={deleteError}
        />
      )}
    </div>
  );
}

function toPosition(node: PositionTreeNode): Position {
  return {
    id: node.id,
    name: node.name,
    description: node.description,
    department: node.department,
    level: node.level,
    parentId: node.parentId,
    createdAt: '',
    updatedAt: '',
  };
}

function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white py-16 text-center">
      <p className="text-sm font-medium text-ink">No org chart yet</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-ink/50">
        Create the root position (e.g. CEO) to start building the
        hierarchy.
      </p>
      <button
        onClick={onCreate}
        className="focus-ring mt-4 rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark"
      >
        + Create root position
      </button>
    </div>
  );
}
