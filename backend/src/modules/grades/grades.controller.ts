import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../generated/prisma/client';

@ApiTags('grades')
@Controller('grades')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Give grade to student (instructor only)' })
  async create(
    @CurrentUser('id') instructorId: string,
    @Body() dto: CreateGradeDto,
  ) {
    return this.gradesService.create(instructorId, dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiOperation({ summary: 'Update grade (instructor only)' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') instructorId: string,
    @Body() dto: UpdateGradeDto,
  ) {
    return this.gradesService.update(id, instructorId, dto);
  }

  @Get('enrollment/:enrollmentId')
  @ApiOperation({ summary: 'Get grade by enrollment' })
  async getByEnrollment(@Param('enrollmentId') enrollmentId: string) {
    return this.gradesService.getByEnrollment(enrollmentId);
  }
}
