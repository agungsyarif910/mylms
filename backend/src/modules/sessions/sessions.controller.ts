import {
  Controller, Get, Post, Put, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../generated/prisma/client';

@ApiTags('sessions')
@Controller('courses/:courseId/sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  @ApiOperation({ summary: 'List sessions for a course' })
  async findByCourse(@Param('courseId') courseId: string) {
    return this.sessionsService.findByCourse(courseId);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create session (instructor only)' })
  async create(
    @Param('courseId') courseId: string,
    @CurrentUser('id') instructorId: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionsService.create(courseId, instructorId, dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update session (instructor only)' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') instructorId: string,
    @Body() dto: UpdateSessionDto,
  ) {
    return this.sessionsService.update(id, instructorId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete session (instructor only)' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') instructorId: string,
  ) {
    return this.sessionsService.delete(id, instructorId);
  }
}
