import { IsUUID, IsNotEmpty, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateGradeDto {
  @ApiProperty({ example: 'uuid-of-enrollment' })
  @IsUUID()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ example: 85.5 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @Type(() => Number)
  score: number;

  @ApiPropertyOptional({ example: 'A' })
  @IsString()
  @IsOptional()
  letterGrade?: string;

  @ApiPropertyOptional({ example: 'Excellent work on the final project' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateGradeDto {
  @ApiPropertyOptional({ example: 90 })
  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  score?: number;

  @ApiPropertyOptional({ example: 'A' })
  @IsString()
  @IsOptional()
  letterGrade?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
