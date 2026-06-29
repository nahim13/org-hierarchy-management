'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Position } from '@/types/position';

const formSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  description: z
    .string()
    .trim()
    .min(3, 'Description must be at least 3 characters'),
  department: z.string().trim().optional(),
  parentId: z.string().optional(),
});

export type PositionFormValues = z.infer<typeof formSchema>;

interface PositionFormProps {
  mode: 'create' | 'edit';
  defaultValues?: Partial<PositionFormValues>;
  /** Positions that are valid parent choices (self/descendants excluded by the caller). */
  parentOptions: Position[];
  /** Locks the parent selector — used when creating a child from the tree view. */
  lockedParentName?: string;
  onSubmit: (values: PositionFormValues) => void;
  onCancel: () => void;
  submitting?: boolean;
  serverError?: string | null;
}

export function PositionForm({
  mode,
  defaultValues,
  parentOptions,
  lockedParentName,
  onSubmit,
  onCancel,
  submitting,
  serverError,
}: PositionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PositionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      department: '',
      parentId: '',
      ...defaultValues,
    },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-lg border border-line bg-white p-5 shadow-card"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-ink/60">
          Name
        </label>
        <input
          {...register('name')}
          className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
          placeholder="e.g. VP of Engineering"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink/60">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={2}
          className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
          placeholder="What this position is responsible for"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink/60">
          Department <span className="text-ink/35">(optional)</span>
        </label>
        <input
          {...register('department')}
          className="focus-ring w-full rounded-md border border-line px-3 py-2 text-sm"
          placeholder="e.g. Engineering"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-ink/60">
          Reports to
        </label>
        {lockedParentName ? (
          <p className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink/70">
            {lockedParentName}
          </p>
        ) : (
          <select
            {...register('parentId')}
            className="focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm"
          >
            <option value="">— None (this becomes the root) —</option>
            {parentOptions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
          </select>
        )}
        <p className="mt-1 text-xs text-ink/40">
          The API still re-checks this for cycles even if it's not in this
          list.
        </p>
      </div>

      {serverError && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </p>
      )}

      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="focus-ring rounded-md border border-line px-3 py-2 text-sm font-medium text-ink/70 hover:bg-surface"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="focus-ring rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-60"
        >
          {submitting
            ? 'Saving…'
            : mode === 'create'
              ? 'Create position'
              : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
