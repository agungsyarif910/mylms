import { Controller, Get, Post, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { CertificatesService } from './certificates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { Role } from '../../generated/prisma/client';

@ApiTags('certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  @Post('generate/:enrollmentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.INSTRUCTOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate certificate for enrollment (instructor only)' })
  async generate(
    @Param('enrollmentId') enrollmentId: string,
    @CurrentUser('id') instructorId: string,
  ) {
    return this.certificatesService.generate(enrollmentId, instructorId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate info' })
  async getById(@Param('id') id: string) {
    return this.certificatesService.getById(id);
  }

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download certificate PDF' })
  async download(@Param('id') id: string, @Res() res: Response) {
    const filePath = await this.certificatesService.getFilePath(id);
    res.download(filePath);
  }

  @Get('verify/:certificateNumber')
  @ApiOperation({ summary: 'Verify certificate by number (public)' })
  async verify(@Param('certificateNumber') certificateNumber: string) {
    return this.certificatesService.verify(certificateNumber);
  }
}
