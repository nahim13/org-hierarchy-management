import type {
  ApiErrorBody,
  CreatePositionInput,
  Position,
  PositionTreeNode,
  UpdatePositionInput,
} from '@/types/position';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | null;
    const rawMessage = errorBody?.error;
    const message =
      typeof rawMessage === 'string'
        ? rawMessage
        : Array.isArray(rawMessage?.message)
          ? rawMessage.message.join(', ')
          : rawMessage?.message ?? `Request failed with ${response.status}`;

    throw new ApiError(response.status, message as string);
  }

  return body as T;
}

export const positionsApi = {
  list: (search?: string) =>
    request<Position[]>(
      `/positions${search ? `?search=${encodeURIComponent(search)}` : ''}`,
    ),

  tree: () => request<PositionTreeNode[]>('/positions/tree'),

  get: (id: string) => request<Position>(`/positions/${id}`),

  children: (id: string) => request<Position[]>(`/positions/${id}/children`),

  ancestors: (id: string) => request<Position[]>(`/positions/${id}/ancestors`),

  create: (input: CreatePositionInput) =>
    request<Position>('/positions', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  update: (id: string, input: UpdatePositionInput) =>
    request<Position>(`/positions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    }),

  remove: (id: string) =>
    request<void>(`/positions/${id}`, { method: 'DELETE' }),
};
