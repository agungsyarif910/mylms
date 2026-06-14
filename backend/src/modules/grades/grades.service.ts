import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateGradeDto, UpdateGradeDto } from './dto/grade.dto';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  async create(instructorId: string, dto: CreateGradeDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: { course: true, grade: true },
    });

    if (!enrollment) throw new NotFoundException('Enrollment tidak ditemukan');
    if (enrollment.course.instructorId !== instructorId) {
      throw new BadRequestException('Anda tidak memiliki akses');
    }
    if (enrollment.grade) {
      throw new BadRequestException('Grade sudah ada, gunakan update');
    }

    const letterGrade = dto.letterGrade || this.calculateLetterGrade(dto.score);

    const grade = await this.prisma.grade.create({
      data: {
        enrollmentId: dto.enrollmentId,
        gradedById: instructorId,
        score: dto.score,
        letterGrade,
        notes: dto.notes,
      },
      include: {
        enrollment: {
          include: {
            user: { select: { fullName: true, email: true } },
            course: { select: { title: true } },
          },
        },
      },
    });

    return { message: 'Grade berhasil diberikan', grade };
  }

  async update(id: string, instructorId: string, dto: UpdateGradeDto) {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: { enrollment: { include: { course: true } } },
    });

    if (!grade) throw new NotFoundException('Grade tidak ditemukan');
    if (grade.enrollment.course.instructorId !== instructorId) {
      throw new BadRequestException('Anda tidak memiliki akses');
    }

    const updated = await this.prisma.grade.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.score && !dto.letterGrade && { letterGrade: this.calculateLetterGrade(dto.score) }),
        gradedAt: new Date(),
      },
    });

    return { message: 'Grade berhasil diperbarui', grade: updated };
  }

  async getByEnrollment(enrollmentId: string) {
    const grade = await this.prisma.grade.findUnique({
      where: { enrollmentId },
      include: {
        gradedBy: { select: { fullName: true } },
      },
    });

    if (!grade) throw new NotFoundException('Grade belum tersedia');
    return grade;
  }

  private calculateLetterGrade(score: number): string {
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'D';
    return 'E';
  }
}
