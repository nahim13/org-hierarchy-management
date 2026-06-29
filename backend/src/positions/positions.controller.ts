import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { PositionEntity } from './position.entity';
import { PositionTree } from './position-tree.interface';
import { PositionsService } from './positions.service';

@ApiTags('positions')
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new position' })
  @ApiCreatedResponse({ type: PositionEntity })
  create(@Body() dto: CreatePositionDto): Promise<PositionEntity> {
    return this.positionsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all positions as a flat list' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Filter by name (case-insensitive, partial match)',
  })
  @ApiOkResponse({ type: [PositionEntity] })
  findAll(@Query('search') search?: string): Promise<PositionEntity[]> {
    return this.positionsService.findAll(search);
  }

  @Get('tree')
  @ApiOperation({ summary: 'Get the full nested organization hierarchy' })
  @ApiOkResponse({ description: 'Organization hierarchy tree.' })
  findTree(): Promise<PositionTree[]> {
    return this.positionsService.findTree();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single position detail' })
  @ApiOkResponse({ type: PositionEntity })
  findOne(@Param('id') id: string): Promise<PositionEntity> {
    return this.positionsService.findOne(id);
  }

  @Get(':id/children')
  @ApiOperation({ summary: 'Get the direct children of a position' })
  @ApiOkResponse({ type: [PositionEntity] })
  findChildren(@Param('id') id: string): Promise<PositionEntity[]> {
    return this.positionsService.findChildren(id);
  }

  @Get(':id/ancestors')
  @ApiOperation({
    summary: 'Get the reporting line from a position up to the CEO',
  })
  @ApiOkResponse({ type: [PositionEntity] })
  findAncestors(@Param('id') id: string): Promise<PositionEntity[]> {
    return this.positionsService.findAncestors(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update a position, including reparenting (cycle-checked)',
  })
  @ApiOkResponse({ type: PositionEntity })
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePositionDto,
  ): Promise<PositionEntity> {
    return this.positionsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Delete a position. Children are reassigned to its parent; the ' +
      'root cannot be deleted. Soft delete - the row is kept and flagged.',
  })
  @ApiNoContentResponse({ description: 'Position removed.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.positionsService.remove(id);
  }
}
