import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateFeedbackDto } from './dto/feedback.dto';

@Injectable()
export class FeedbacksService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateFeedbackDto) {
    // Check enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId: dto.courseId } },
    });

    if (!enrollment || enrollment.status === 'PENDING') {
      throw new BadRequestException('Anda belum terdaftar di course ini');
    }

    // Check existing feedback
    const existing = await this.prisma.feedback.findFirst({
      where: { userId, courseId: dto.courseId },
    });

    if (existing) {
      throw new BadRequestException('Anda sudah memberikan feedback');
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        userId,
        courseId: dto.courseId,
        enrollmentId: enrollment.id,
        rating: dto.rating,
        comment: dto.comment,
        isAnonymous: dto.isAnonymous || false,
      },
    });

    return { message: 'Feedback berhasil dikirim', feedback };
  }

  async getCourseFeedbacks(courseId: string) {
    const feedbacks = await this.prisma.feedback.findMany({
      where: { courseId },
      include: {
        user: { select: { fullName: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Hide user info for anonymous feedbacks
    return feedbacks.map((f) => ({
      ...f,
      user: f.isAnonymous ? { fullName: 'Anonim', avatarUrl: null } : f.user,
    }));
  }

  async getAllFeedbacks(instructorId: string) {
    return this.prisma.feedback.findMany({
      where: { course: { instructorId } },
      include: {
        user: { select: { fullName: true } },
        course: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
