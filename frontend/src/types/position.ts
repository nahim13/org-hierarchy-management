export interface Position {
  id: string;
  name: string;
  description: string;
  department: string | null;
  level: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PositionTreeNode {
  id: string;
  name: string;
  description: string;
  department: string | null;
  level: number;
  parentId: string | null;
  children: PositionTreeNode[];
}

export interface CreatePositionInput {
  name: string;
  description: string;
  department?: string | null;
  parentId?: string | null;
}

export interface UpdatePositionInput {
  name?: string;
  description?: string;
  department?: string | null;
  parentId?: string | null;
}

export interface ApiErrorBody {
  statusCode: number;
  timestamp: string;
  path: string;
  error: { message: string | string[] } | string;
}
