import { Test, TestingModule } from '@nestjs/testing';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionEntity } from './position.entity';
import { PositionTree } from './position-tree.interface';
import { PositionsController } from './positions.controller';
import { PositionsService } from './positions.service';

describe('PositionsController', () => {
  let controller: PositionsController;
  let service: jest.Mocked<PositionsService>;

  const ceo = {
    id: 'ceo-id',
    name: 'CEO',
    description: 'Chief Executive Officer',
    department: 'Executive',
    level: 0,
    parentId: null,
  } as PositionEntity;

  const cto = {
    id: 'cto-id',
    name: 'CTO',
    description: 'Chief Technology Officer',
    department: 'Technology',
    level: 1,
    parentId: 'ceo-id',
  } as PositionEntity;

  beforeEach(async () => {
    const serviceMock = {
      create: jest.fn(),
      findAll: jest.fn(),
      findTree: jest.fn(),
      findOne: jest.fn(),
      findChildren: jest.fn(),
      findAncestors: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionsController],
      providers: [
        {
          provide: PositionsService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<PositionsController>(PositionsController);
    service = module.get(PositionsService);
  });

  it('should create a new position', async () => {
    const dto: CreatePositionDto = {
      name: 'CEO',
      description: 'Chief Executive Officer',
    };
    service.create.mockResolvedValue(ceo);

    await expect(controller.create(dto)).resolves.toBe(ceo);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('should list all positions, forwarding the search query', async () => {
    service.findAll.mockResolvedValue([ceo, cto]);

    await expect(controller.findAll('CT')).resolves.toEqual([ceo, cto]);
    expect(service.findAll).toHaveBeenCalledWith('CT');
  });

  it('should return the full hierarchy tree', async () => {
    const tree: PositionTree[] = [
      {
        id: 'ceo-id',
        name: 'CEO',
        description: 'Chief Executive Officer',
        department: 'Executive',
        level: 0,
        parentId: null,
        children: [
          {
            id: 'cto-id',
            name: 'CTO',
            description: 'Chief Technology Officer',
            department: 'Technology',
            level: 1,
            parentId: 'ceo-id',
            children: [],
          },
        ],
      },
    ];
    service.findTree.mockResolvedValue(tree);

    await expect(controller.findTree()).resolves.toEqual(tree);
    expect(service.findTree).toHaveBeenCalledTimes(1);
  });

  it('should get a single position detail', async () => {
    service.findOne.mockResolvedValue(cto);

    await expect(controller.findOne('cto-id')).resolves.toBe(cto);
    expect(service.findOne).toHaveBeenCalledWith('cto-id');
  });

  it('should get the direct children of a position', async () => {
    service.findChildren.mockResolvedValue([cto]);

    await expect(controller.findChildren('ceo-id')).resolves.toEqual([cto]);
    expect(service.findChildren).toHaveBeenCalledWith('ceo-id');
  });

  it('should get the reporting line (ancestors) of a position', async () => {
    service.findAncestors.mockResolvedValue([ceo]);

    await expect(controller.findAncestors('cto-id')).resolves.toEqual([ceo]);
    expect(service.findAncestors).toHaveBeenCalledWith('cto-id');
  });

  it('should update a position', async () => {
    const dto: UpdatePositionDto = {
      name: 'Chief Technology Officer',
    };
    service.update.mockResolvedValue(cto);

    await expect(controller.update('cto-id', dto)).resolves.toBe(cto);
    expect(service.update).toHaveBeenCalledWith('cto-id', dto);
  });

  it('should remove a position', async () => {
    service.remove.mockResolvedValue(undefined);

    await expect(controller.remove('cto-id')).resolves.toBeUndefined();
    expect(service.remove).toHaveBeenCalledWith('cto-id');
  });
});
