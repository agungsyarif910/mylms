import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateSessionDto {
  @ApiProperty({ example: 'Sesi 1: Pengenalan HTML & CSS' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'Materi pengenalan dasar...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2025-06-15' })
  @IsDateString()
  @IsNotEmpty()
  sessionDate: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '11:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ example: 'https://zoom.us/j/123456789' })
  @IsString()
  @IsOptional()
  zoomLink?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  sessionOrder: number;
}

export class UpdateSessionDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  sessionDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  zoomLink?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  sessionOrder?: number;

  @ApiPropertyOptional({ enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'] })
  @IsString()
  @IsOptional()
  status?: string;
}
