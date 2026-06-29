import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { PositionsService } from './positions.service';
import { PositionsRepository } from './positions.repository';
import { PositionEntity } from './position.entity';

type MockRepo = {
  [K in keyof PositionsRepository]: jest.Mock;
};

const makePosition = (overrides: Partial<PositionEntity>): PositionEntity =>
  ({
    id: 'id',
    name: 'name',
    description: 'description',
    department: null,
    level: 0,
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  }) as PositionEntity;

describe('PositionsService', () => {
  let service: PositionsService;
  let repo: MockRepo;

  beforeEach(async () => {
    repo = {
      create: jest.fn((data) => data),
      save: jest.fn((entity) => Promise.resolve(entity)),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findRoot: jest.fn(),
      findChildren: jest.fn(),
      reassignChildren: jest.fn(),
      softDelete: jest.fn(),
      findDescendants: jest.fn(),
      findAncestors: jest.fn(),
    } as unknown as MockRepo;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PositionsService,
        { provide: PositionsRepository, useValue: repo },
      ],
    }).compile();

    service = module.get<PositionsService>(PositionsService);
  });

  describe('cycle prevention', () => {
    it('rejects reparenting a node under its own descendant', async () => {
      const cto = makePosition({ id: 'cto', parentId: 'ceo', level: 1 });
      const teamLead = makePosition({
        id: 'team-lead',
        parentId: 'cto',
        level: 2,
      });

      repo.findOne.mockResolvedValueOnce(cto); // findOne(id) inside update
      repo.findOne.mockResolvedValueOnce(teamLead); // findOne(newParentId)
      repo.findDescendants.mockResolvedValueOnce([teamLead]);

      await expect(
        service.update('cto', { parentId: 'team-lead' }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(repo.findDescendants).toHaveBeenCalledWith('cto');
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('rejects a node reporting to itself', async () => {
      const cto = makePosition({ id: 'cto', parentId: 'ceo', level: 1 });
      repo.findOne.mockResolvedValueOnce(cto);

      await expect(
        service.update('cto', { parentId: 'cto' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('allows reparenting to a non-descendant and recalculates levels', async () => {
      const ceo = makePosition({ id: 'ceo', parentId: null, level: 0 });
      const cfo = makePosition({ id: 'cfo', parentId: 'ceo', level: 1 });
      const cto = makePosition({ id: 'cto', parentId: 'ceo', level: 1 });

      repo.findOne
        .mockResolvedValueOnce(cto) // findOne(id)
        .mockResolvedValueOnce(cfo) // findOne(newParentId)
        .mockResolvedValueOnce(cto); // recomputeSubtreeLevels(node)
      repo.findDescendants.mockResolvedValueOnce([]);
      repo.findChildren.mockResolvedValueOnce([]); // no descendants to cascade

      const result = await service.update('cto', { parentId: 'cfo' });

      expect(result.parentId).toBe('cfo');
      expect(result.level).toBe(2); // cfo.level (1) + 1
    });
  });

  describe('deletion policy', () => {
    it('blocks deleting the root position', async () => {
      const ceo = makePosition({ id: 'ceo', parentId: null });
      repo.findOne.mockResolvedValueOnce(ceo);

      await expect(service.remove('ceo')).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(repo.softDelete).not.toHaveBeenCalled();
    });

    it('reassigns children to the deleted node\'s parent and soft-deletes it', async () => {
      const ceo = makePosition({ id: 'ceo', parentId: null, level: 0 });
      const cto = makePosition({ id: 'cto', parentId: 'ceo', level: 1 });
      const teamLead = makePosition({
        id: 'team-lead',
        parentId: 'cto',
        level: 2,
      });

      repo.findOne
        .mockResolvedValueOnce(cto) // findOne(id) in remove()
        .mockResolvedValueOnce(ceo) // findOne(position.parentId) -> grandparent
        .mockResolvedValueOnce(teamLead) // recomputeSubtreeLevels(team-lead)
        ;
      repo.findChildren
        .mockResolvedValueOnce([teamLead]) // direct children of cto
        .mockResolvedValueOnce([]); // team-lead has no children

      await service.remove('cto');

      expect(repo.reassignChildren).toHaveBeenCalledWith(
        'cto',
        'ceo', // cto's parent (the grandparent of team-lead)
        1, // ceo.level (0) + 1
      );
      expect(repo.softDelete).toHaveBeenCalledWith('cto');
    });

    it('soft-deletes a leaf node with no children directly', async () => {
      const cto = makePosition({ id: 'cto', parentId: 'ceo', level: 1 });
      repo.findOne.mockResolvedValueOnce(cto);
      repo.findChildren.mockResolvedValueOnce([]);

      await service.remove('cto');

      expect(repo.reassignChildren).not.toHaveBeenCalled();
      expect(repo.softDelete).toHaveBeenCalledWith('cto');
    });
  });

  describe('single-root enforcement', () => {
    it('rejects creating a second root position', async () => {
      repo.findRoot.mockResolvedValueOnce(
        makePosition({ id: 'existing-ceo', parentId: null }),
      );

      await expect(
        service.create({ name: 'New CEO', description: 'desc' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
