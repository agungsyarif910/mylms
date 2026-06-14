import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto';
import { SessionStatus } from '../../generated/prisma/client';

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async create(courseId: string, instructorId: string, dto: CreateSessionDto) {
    // Verify course ownership
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course tidak ditemukan');
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('Anda tidak memiliki akses');
    }

    const session = await this.prisma.courseSession.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        sessionDate: new Date(dto.sessionDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        zoomLink: dto.zoomLink,
        sessionOrder: dto.sessionOrder,
      },
    });

    return { message: 'Session berhasil dibuat', session };
  }

  async findByCourse(courseId: string) {
    return this.prisma.courseSession.findMany({
      where: { courseId },
      orderBy: { sessionOrder: 'asc' },
    });
  }

  async update(id: string, instructorId: string, dto: UpdateSessionDto) {
    const session = await this.prisma.courseSession.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!session) throw new NotFoundException('Session tidak ditemukan');
    if (session.course.instructorId !== instructorId) {
      throw new ForbiddenException('Anda tidak memiliki akses');
    }

    const data: Record<string, any> = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.startTime !== undefined) data.startTime = dto.startTime;
    if (dto.endTime !== undefined) data.endTime = dto.endTime;
    if (dto.zoomLink !== undefined) data.zoomLink = dto.zoomLink;
    if (dto.sessionOrder !== undefined) data.sessionOrder = dto.sessionOrder;
    if (dto.sessionDate) data.sessionDate = new Date(dto.sessionDate);
    if (dto.status) data.status = dto.status as SessionStatus;

    const updated = await this.prisma.courseSession.update({
      where: { id },
      data,
    });

    return { message: 'Session berhasil diperbarui', session: updated };
  }

  async delete(id: string, instructorId: string) {
    const session = await this.prisma.courseSession.findUnique({
      where: { id },
      include: { course: true },
    });

    if (!session) throw new NotFoundException('Session tidak ditemukan');
    if (session.course.instructorId !== instructorId) {
      throw new ForbiddenException('Anda tidak memiliki akses');
    }

    await this.prisma.courseSession.delete({ where: { id } });
    return { message: 'Session berhasil dihapus' };
  }
}
