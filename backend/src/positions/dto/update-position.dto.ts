import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class UpdatePositionDto {
  @ApiPropertyOptional({
    example: 'Chief Technology Officer',
    description: 'Updated position name.',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({
    example: 'Owns technology strategy, delivery, and engineering standards.',
    description: 'Updated position description.',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;

  @ApiPropertyOptional({
    example: 'Technology',
    description: 'Updated department or functional area.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string | null;

  @ApiPropertyOptional({
    example: '7b790c08-f5d7-4e36-a570-3b9e7efc12aa',
    description:
      'Updated managing position. Use null to make this position the root.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
