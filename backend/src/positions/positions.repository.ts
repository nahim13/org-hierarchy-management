import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import { PositionEntity } from './position.entity';

type PositionRow = {
  id: string;
  name: string;
  description: string;
  department: string | null;
  level: number;
  parent_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
};

@Injectable()
export class PositionsRepository {
  constructor(
    @InjectRepository(PositionEntity)
    private readonly repository: Repository<PositionEntity>,
  ) {}

  create(data: Partial<PositionEntity>): PositionEntity {
    return this.repository.create(data);
  }

  save(position: PositionEntity): Promise<PositionEntity> {
    return this.repository.save(position);
  }

  findAll(search?: string): Promise<PositionEntity[]> {
    return this.repository.find({
      where: search ? { name: ILike(`%${search}%`) } : undefined,
      order: { level: 'ASC', name: 'ASC' },
    });
  }

  findOne(id: string): Promise<PositionEntity | null> {
    return this.repository.findOne({ where: { id } });
  }

  findRoot(ignoreId?: string): Promise<PositionEntity | null> {
    const where = ignoreId
      ? { parentId: IsNull(), id: Not(ignoreId) }
      : { parentId: IsNull() };

    return this.repository.findOne({ where });
  }

  findChildren(parentId: string): Promise<PositionEntity[]> {
    return this.repository.find({
      where: { parentId },
      order: { level: 'ASC', name: 'ASC' },
    });
  }

  async reassignChildren(
    oldParentId: string,
    newParentId: string | null,
    newLevel: number,
  ): Promise<void> {
    await this.repository.update(
      { parentId: oldParentId },
      { parentId: newParentId, level: newLevel },
    );
  }

  softDelete(id: string): Promise<unknown> {
    return this.repository.softDelete(id);
  }

  async findDescendants(rootId: string): Promise<PositionEntity[]> {
    const rows = await this.repository.query(
      `
        WITH RECURSIVE position_tree AS (
          SELECT *
          FROM positions
          WHERE id = $1 AND deleted_at IS NULL
          UNION ALL
          SELECT child.*
          FROM positions child
          INNER JOIN position_tree parent ON child.parent_id = parent.id
          WHERE child.deleted_at IS NULL
        )
        SELECT *
        FROM position_tree
        ORDER BY level ASC, name ASC
      `,
      [rootId],
    );

    return rows.map((row: PositionRow) => this.toEntity(row));
  }

  async findAncestors(id: string): Promise<PositionEntity[]> {
    const rows = await this.repository.query(
      `
        WITH RECURSIVE ancestors AS (
          SELECT *, 0 AS depth
          FROM positions
          WHERE id = $1 AND deleted_at IS NULL
          UNION ALL
          SELECT parent.*, ancestors.depth + 1 AS depth
          FROM positions parent
          INNER JOIN ancestors ON ancestors.parent_id = parent.id
          WHERE parent.deleted_at IS NULL
        )
        SELECT *
        FROM ancestors
        WHERE id <> $1
        ORDER BY depth DESC
      `,
      [id],
    );

    return rows.map((row: PositionRow) => this.toEntity(row));
  }

  private toEntity(row: PositionRow): PositionEntity {
    return this.repository.create({
      id: row.id,
      name: row.name,
      description: row.description,
      department: row.department,
      level: row.level,
      parentId: row.parent_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    });
  }
}
