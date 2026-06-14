import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto, CourseQueryDto } from './dto/course.dto';
import { Prisma } from '../../generated/prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(instructorId: string, dto: CreateCourseDto) {
    const course = await this.prisma.course.create({
      data: {
        instructorId,
        title: dto.title,
        description: dto.description,
        shortDescription: dto.shortDescription,
        price: dto.price,
        maxParticipants: dto.maxParticipants,
        thumbnailUrl: dto.thumbnailUrl,
        category: dto.category,
      },
    });

    return { message: 'Course berhasil dibuat', course };
  }

  async findAll(query: CourseQueryDto) {
    const { page = 1, limit = 10, search, category } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CourseWhereInput = {
      status: 'PUBLISHED',
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(category && { category }),
    };

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        include: {
          instructor: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          _count: {
            select: { enrollments: true, sessions: true, feedbacks: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findAllByInstructor(instructorId: string) {
    return this.prisma.course.findMany({
      where: { instructorId },
      include: {
        _count: {
          select: { enrollments: true, sessions: true, feedbacks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, fullName: true, avatarUrl: true, email: true },
        },
        sessions: {
          orderBy: { sessionOrder: 'asc' },
        },
        _count: {
          select: { enrollments: true, feedbacks: true },
        },
        feedbacks: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course tidak ditemukan');
    }

    // Calculate average rating
    const avgRating = await this.prisma.feedback.aggregate({
      where: { courseId: id },
      _avg: { rating: true },
    });

    return { ...course, averageRating: avgRating._avg.rating || 0 };
  }

  async update(id: string, instructorId: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new NotFoundException('Course tidak ditemukan');
    }

    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke course ini');
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: dto,
    });

    return { message: 'Course berhasil diperbarui', course: updated };
  }

  async publish(id: string, instructorId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) {
      throw new NotFoundException('Course tidak ditemukan');
    }

    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke course ini');
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    return { message: 'Course berhasil dipublish', course: updated };
  }

  async archive(id: string, instructorId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) throw new NotFoundException('Course tidak ditemukan');
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke course ini');
    }

    const updated = await this.prisma.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return { message: 'Course berhasil diarsipkan', course: updated };
  }

  async delete(id: string, instructorId: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });

    if (!course) throw new NotFoundException('Course tidak ditemukan');
    if (course.instructorId !== instructorId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke course ini');
    }

    // Soft delete via archive
    await this.prisma.course.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    return { message: 'Course berhasil dihapus' };
  }

  async getDashboardStats(instructorId: string) {
    const [totalCourses, totalEnrollments, totalRevenue, avgRating] =
      await Promise.all([
        this.prisma.course.count({ where: { instructorId } }),
        this.prisma.enrollment.count({
          where: {
            course: { instructorId },
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
        }),
        this.prisma.payment.aggregate({
          where: {
            enrollment: { course: { instructorId } },
            status: 'PAID',
          },
          _sum: { amount: true },
        }),
        this.prisma.feedback.aggregate({
          where: { course: { instructorId } },
          _avg: { rating: true },
        }),
      ]);

    return {
      totalCourses,
      totalEnrollments,
      totalRevenue: totalRevenue._sum.amount || 0,
      averageRating: avgRating._avg.rating || 0,
    };
  }
}
