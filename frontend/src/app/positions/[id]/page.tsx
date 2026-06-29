'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, positionsApi } from '@/lib/api';
import { PositionForm, type PositionFormValues } from '@/components/PositionForm';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

export default function PositionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const positionQuery = useQuery({
    queryKey: ['positions', 'detail', id],
    queryFn: () => positionsApi.get(id),
  });

  const ancestorsQuery = useQuery({
    queryKey: ['positions', 'ancestors', id],
    queryFn: () => positionsApi.ancestors(id),
  });

  const childrenQuery = useQuery({
    queryKey: ['positions', 'children', id],
    queryFn: () => positionsApi.children(id),
  });

  const allPositionsQuery = useQuery({
    queryKey: ['positions', 'list', ''],
    queryFn: () => positionsApi.list(),
  });

  const updateMutation = useMutation({
    mutationFn: (values: PositionFormValues) =>
      positionsApi.update(id, {
        name: values.name,
        description: values.description,
        department: values.department || null,
        parentId: values.parentId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => positionsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      router.push('/');
    },
    onError: (error) => {
      setDeleteError(
        error instanceof ApiError ? error.message : 'Failed to delete.',
      );
    },
  });

  if (positionQuery.isLoading) {
    return <p className="text-sm text-ink/50">Loading…</p>;
  }

  if (positionQuery.isError || !positionQuery.data) {
    return (
      <div>
        <p className="text-sm text-red-600">
          {positionQuery.error instanceof ApiError
            ? positionQuery.error.message
            : 'Position not found.'}
        </p>
        <Link href="/" className="mt-2 inline-block text-sm text-accent">
          ← Back to org chart
        </Link>
      </div>
    );
  }

  const position = positionQuery.data;
  const ancestors = ancestorsQuery.data ?? [];
  const children = childrenQuery.data ?? [];
  const parentOptions = (allPositionsQuery.data ?? []).filter(
    (p) => p.id !== id,
  );

  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap items-center gap-1 text-sm text-ink/50">
        <Link href="/" className="hover:text-accent">
          Org chart
        </Link>
        {ancestors.map((ancestor) => (
          <span key={ancestor.id} className="flex items-center gap-1">
            <span>/</span>
            <Link
              href={`/positions/${ancestor.id}`}
              className="hover:text-accent"
            >
              {ancestor.name}
            </Link>
          </span>
        ))}
        <span>/</span>
        <span className="font-medium text-ink">{position.name}</span>
      </nav>

      {editing ? (
        <PositionForm
          mode="edit"
          defaultValues={{
            name: position.name,
            description: position.description,
            department: position.department ?? '',
            parentId: position.parentId ?? '',
          }}
          parentOptions={parentOptions}
          onSubmit={(values) => updateMutation.mutate(values)}
          onCancel={() => setEditing(false)}
          submitting={updateMutation.isPending}
          serverError={
            updateMutation.error instanceof ApiError
              ? updateMutation.error.message
              : null
          }
        />
      ) : (
        <div className="rounded-lg border border-line bg-white p-5 shadow-card">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold text-ink">
                {position.name}
              </h1>
              <p className="mt-1 text-sm text-ink/60">
                {position.department ?? 'No department set'} · Level{' '}
                {position.level}
                {position.parentId === null && ' · Root'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditing(true)}
                className="focus-ring rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink/70 hover:bg-surface"
              >
                Edit
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="focus-ring rounded-md border border-line px-3 py-1.5 text-sm font-medium text-ink/70 hover:border-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm text-ink/80">{position.description}</p>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink">
          Direct reports
        </h2>
        {children.length === 0 ? (
          <p className="text-sm text-ink/45">No direct reports.</p>
        ) : (
          <ul className="space-y-1.5">
            {children.map((child) => (
              <li key={child.id}>
                <Link
                  href={`/positions/${child.id}`}
                  className="flex items-center justify-between rounded-md border border-line bg-white px-3 py-2 text-sm hover:border-accent"
                >
                  <span className="font-medium text-ink">{child.name}</span>
                  <span className="text-ink/45">
                    {child.department ?? '—'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirmingDelete && (
        <DeleteConfirmDialog
          position={position}
          parentName={ancestors[ancestors.length - 1]?.name ?? null}
          childCount={children.length}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => {
            setConfirmingDelete(false);
            setDeleteError(null);
          }}
          isDeleting={deleteMutation.isPending}
          error={deleteError}
        />
      )}
    </div>
  );
}
