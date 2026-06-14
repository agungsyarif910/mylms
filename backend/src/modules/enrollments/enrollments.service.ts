import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateEnrollmentDto) {
    // Check if course exists and is published
    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
      include: { _count: { select: { enrollments: true } } },
    });

    if (!course) throw new NotFoundException('Course tidak ditemukan');
    if (course.status !== 'PUBLISHED') {
      throw new BadRequestException('Course belum dipublish');
    }

    // Check quota
    const activeEnrollments = await this.prisma.enrollment.count({
      where: {
        courseId: dto.courseId,
        status: { in: ['PENDING', 'ACTIVE', 'COMPLETED'] },
      },
    });

    if (activeEnrollments >= course.maxParticipants) {
      throw new BadRequestException('Kuota peserta sudah penuh');
    }

    // Check if already enrolled
    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: dto.courseId } },
    });

    if (existing) {
      throw new ConflictException('Anda sudah terdaftar di course ini');
    }

    // Create enrollment (status PENDING until payment)
    const enrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId: dto.courseId,
        status: 'PENDING',
      },
      include: {
        course: {
          select: { id: true, title: true, price: true },
        },
      },
    });

    return {
      message: 'Enrollment berhasil, silakan lakukan pembayaran',
      enrollment,
    };
  }

  async getMyEnrollments(userId: string) {
    return this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { fullName: true, avatarUrl: true } },
            sessions: {
              orderBy: { sessionOrder: 'asc' },
              where: { status: { not: 'CANCELLED' } },
            },
            _count: { select: { sessions: true } },
          },
        },
        payment: { select: { status: true, paidAt: true } },
        grade: true,
        certificate: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCourseEnrollments(courseId: string, instructorId: string) {
    // Verify ownership
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) throw new NotFoundException('Course tidak ditemukan');
    if (course.instructorId !== instructorId) {
      throw new BadRequestException('Anda tidak memiliki akses');
    }

    return this.prisma.enrollment.findMany({
      where: {
        courseId,
        status: { in: ['ACTIVE', 'COMPLETED'] },
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, avatarUrl: true },
        },
        grade: true,
        certificate: true,
        payment: { select: { status: true, amount: true, paidAt: true } },
      },
      orderBy: { enrolledAt: 'asc' },
    });
  }

  async activateEnrollment(enrollmentId: string) {
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'ACTIVE' },
    });
  }

  async completeEnrollment(enrollmentId: string) {
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }
}
