import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionEntity } from './position.entity';
import { PositionTree } from './position-tree.interface';
import { PositionsRepository } from './positions.repository';

@Injectable()
export class PositionsService {
  constructor(private readonly positionsRepository: PositionsRepository) {}

  async create(dto: CreatePositionDto): Promise<PositionEntity> {
    const name = this.normalizeRequiredText(dto.name, 'name');
    const description = this.normalizeRequiredText(
      dto.description,
      'description',
    );
    const parentId = dto.parentId ?? null;

    let level = 0;

    if (parentId) {
      const parent = await this.findOne(parentId);
      level = parent.level + 1;
    } else {
      // Only one root (the CEO) is allowed in the hierarchy.
      await this.ensureNoOtherRoot();
    }

    const position = this.positionsRepository.create({
      name,
      description,
      department: dto.department ?? null,
      parentId,
      level,
    });

    return this.positionsRepository.save(position);
  }

  findAll(search?: string): Promise<PositionEntity[]> {
    return this.positionsRepository.findAll(search);
  }

  async findTree(): Promise<PositionTree[]> {
    // One flat fetch + an in-memory parent-map pass: O(n), no N+1 queries.
    const positions = await this.positionsRepository.findAll();
    return this.buildTree(positions);
  }

  async findOne(id: string): Promise<PositionEntity> {
    const position = await this.positionsRepository.findOne(id);

    if (!position) {
      throw new NotFoundException(`Position with id "${id}" was not found`);
    }

    return position;
  }

  /** Direct children only - one level down, not the whole subtree. */
  async findChildren(id: string): Promise<PositionEntity[]> {
    await this.findOne(id);
    return this.positionsRepository.findChildren(id);
  }

  /** Reporting line from this position up to the CEO (root), root first. */
  async findAncestors(id: string): Promise<PositionEntity[]> {
    await this.findOne(id);
    return this.positionsRepository.findAncestors(id);
  }

  async update(id: string, dto: UpdatePositionDto): Promise<PositionEntity> {
    const position = await this.findOne(id);

    const nextName =
      dto.name === undefined
        ? position.name
        : this.normalizeRequiredText(dto.name, 'name');
    const nextDescription =
      dto.description === undefined
        ? position.description
        : this.normalizeRequiredText(dto.description, 'description');
    const nextDepartment =
      dto.department === undefined ? position.department : dto.department;
    const isReparenting =
      dto.parentId !== undefined && dto.parentId !== position.parentId;
    const nextParentId =
      dto.parentId === undefined ? position.parentId : dto.parentId;

    let nextLevel = position.level;

    if (isReparenting) {
      nextLevel = await this.validateAndResolveNewParent(id, nextParentId);
    }

    position.name = nextName;
    position.description = nextDescription;
    position.department = nextDepartment;
    position.parentId = nextParentId ?? null;
    position.level = nextLevel;

    const saved = await this.positionsRepository.save(position);

    if (isReparenting) {
      // The node's own depth changed; every descendant's depth shifts too.
      await this.recomputeSubtreeLevels(saved.id);
    }

    return saved;
  }

  /**
   * Deletion policy (resolved decision in the project plan):
   *  - The root (CEO) can never be deleted - there's no parent to promote
   *    its children to, and the org must always have exactly one root.
   *  - Deleting a node with children re-points those children to the
   *    deleted node's own parent, preserving the rest of the tree.
   *  - The row itself is soft-deleted (auditable), not hard-deleted.
   */
  async remove(id: string): Promise<void> {
    const position = await this.findOne(id);

    if (position.parentId === null) {
      throw new ConflictException(
        'The root position cannot be deleted. Promote or reassign the ' +
          'organization before removing its top-level position.',
      );
    }

    const children = await this.positionsRepository.findChildren(id);

    if (children.length > 0) {
      const grandparent = await this.findOne(position.parentId);
      const newLevel = grandparent.level + 1;

      await this.positionsRepository.reassignChildren(
        id,
        position.parentId,
        newLevel,
      );

      // Each reassigned child's own descendants are now one level shallower.
      await Promise.all(
        children.map((child) => this.recomputeSubtreeLevels(child.id)),
      );
    }

    await this.positionsRepository.softDelete(id);
  }

  private buildTree(positions: PositionEntity[]): PositionTree[] {
    const nodes = new Map<string, PositionTree>();

    positions.forEach((position) => {
      nodes.set(position.id, {
        id: position.id,
        name: position.name,
        description: position.description,
        department: position.department,
        level: position.level,
        parentId: position.parentId,
        children: [],
      });
    });

    const roots: PositionTree[] = [];

    positions.forEach((position) => {
      const node = nodes.get(position.id);
      if (!node) {
        return;
      }

      if (position.parentId && nodes.has(position.parentId)) {
        nodes.get(position.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  private async ensureNoOtherRoot(ignoreId?: string): Promise<void> {
    const root = await this.positionsRepository.findRoot(ignoreId);

    if (root) {
      throw new BadRequestException(
        'Only one root position (the CEO) is allowed in the organization ' +
          'hierarchy',
      );
    }
  }

  /**
   * Validates a reparent operation and returns the new level for the node.
   * Cycle prevention: the new parent can never be the node itself, nor any
   * of its own descendants - found via the recursive-CTE subtree query in
   * PositionsRepository, exactly the WITH RECURSIVE statement that backs
   * GET /positions/:id/children-style subtree lookups.
   */
  private async validateAndResolveNewParent(
    positionId: string,
    newParentId: string | null | undefined,
  ): Promise<number> {
    if (!newParentId) {
      await this.ensureNoOtherRoot(positionId);
      return 0;
    }

    if (newParentId === positionId) {
      throw new BadRequestException('A position cannot report to itself');
    }

    const newParent = await this.findOne(newParentId);

    const descendants = await this.positionsRepository.findDescendants(
      positionId,
    );
    const isDescendant = descendants.some(
      (descendant) => descendant.id === newParentId,
    );

    if (isDescendant) {
      throw new BadRequestException(
        'A position cannot report to one of its own descendants',
      );
    }

    return newParent.level + 1;
  }

  /** Walks a subtree top-down, recalculating each descendant's level. */
  private async recomputeSubtreeLevels(nodeId: string): Promise<void> {
    const node = await this.positionsRepository.findOne(nodeId);
    if (!node) {
      return;
    }

    const children = await this.positionsRepository.findChildren(nodeId);

    for (const child of children) {
      child.level = node.level + 1;
      await this.positionsRepository.save(child);
      await this.recomputeSubtreeLevels(child.id);
    }
  }

  private normalizeRequiredText(value: string, field: string): string {
    const normalized = value?.trim();

    if (!normalized) {
      throw new BadRequestException(`${field} is required`);
    }

    return normalized;
  }
}
