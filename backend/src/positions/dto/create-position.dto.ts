import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({
    example: 'Chief Technology Officer',
    description: 'Name of the employee position or role.',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({
    example: 'Leads technology strategy and engineering delivery.',
    description: 'Short explanation of the position responsibility.',
  })
  @IsString()
  @MinLength(3)
  description: string;

  @ApiPropertyOptional({
    example: 'Technology',
    description: 'Department or functional area for the position.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string | null;

  @ApiPropertyOptional({
    example: '7b790c08-f5d7-4e36-a570-3b9e7efc12aa',
    description: 'Managing position that this position reports to.',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;
}
