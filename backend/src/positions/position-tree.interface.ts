export interface PositionTree {
  id: string;
  name: string;
  description: string;
  department: string | null;
  level: number;
  parentId: string | null;
  children: PositionTree[];
}
