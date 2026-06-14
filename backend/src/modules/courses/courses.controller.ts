import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto } from './dto/course.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../generated/prisma/client';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // ===== Public Endpoints =====

  @Get()
  @ApiOperation({ summary: 'List all published courses (public)' })
  async findAll(@Query() query: CourseQueryDto) {
    return this.coursesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course detail (public)' })
  async findById(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }

  // ===== Instructor Endpoints =====

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new course (instructor only)' })
  async create(
    @CurrentUser('id') instructorId: string,
    @Body() dto: CreateCourseDto,
  ) {
    return this.coursesService.create(instructorId, dto);
  }

  @Get('instructor/my-courses')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List instructor own courses' })
  async findMyCourses(@CurrentUser('id') instructorId: string) {
    return this.coursesService.findAllByInstructor(instructorId);
  }

  @Get('instructor/dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor dashboard stats' })
  async getDashboardStats(@CurrentUser('id') instructorId: string) {
    return this.coursesService.getDashboardStats(instructorId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course (instructor only)' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') instructorId: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.coursesService.update(id, instructorId, dto);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish course (instructor only)' })
  async publish(
    @Param('id') id: string,
    @CurrentUser('id') instructorId: string,
  ) {
    return this.coursesService.publish(id, instructorId);
  }

  @Patch(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive course (instructor only)' })
  async archive(
    @Param('id') id: string,
    @CurrentUser('id') instructorId: string,
  ) {
    return this.coursesService.archive(id, instructorId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete course - soft delete (instructor only)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') instructorId: string,
  ) {
    return this.coursesService.delete(id, instructorId);
  }
}
