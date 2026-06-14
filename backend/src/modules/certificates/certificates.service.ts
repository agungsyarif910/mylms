import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import PDFDocument from 'pdfkit';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CertificatesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async generate(enrollmentId: string, instructorId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: true,
        course: { include: { instructor: true } },
        certificate: true,
        grade: true,
      },
    });

    if (!enrollment) throw new NotFoundException('Enrollment tidak ditemukan');
    if (enrollment.course.instructorId !== instructorId) {
      throw new BadRequestException('Anda tidak memiliki akses');
    }
    if (enrollment.certificate) {
      return { message: 'Sertifikat sudah ada', certificate: enrollment.certificate };
    }
    if (enrollment.status !== 'ACTIVE' && enrollment.status !== 'COMPLETED') {
      throw new BadRequestException('Enrollment belum aktif');
    }

    const certificateNumber = `CERT-${Date.now()}-${uuidv4().substring(0, 6).toUpperCase()}`;
    const issuerName = this.configService.get('CERTIFICATE_SIGNER') || 'Instructor';

    // Generate PDF
    const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `${certificateNumber}.pdf`;
    const filePath = path.join(uploadsDir, fileName);
    const fileUrl = `/uploads/certificates/${fileName}`;

    await this.generatePDF(filePath, {
      studentName: enrollment.user.fullName,
      courseName: enrollment.course.title,
      instructorName: enrollment.course.instructor.fullName,
      certificateNumber,
      issueDate: new Date(),
      grade: enrollment.grade
        ? `${enrollment.grade.letterGrade} (${enrollment.grade.score})`
        : undefined,
    });

    // Mark enrollment as completed
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Save certificate record
    const certificate = await this.prisma.certificate.create({
      data: {
        enrollmentId,
        certificateNumber,
        fileUrl,
        certificateData: {
          studentName: enrollment.user.fullName,
          courseName: enrollment.course.title,
          instructorName: enrollment.course.instructor.fullName,
          issuerName,
        },
      },
    });

    return { message: 'Sertifikat berhasil di-generate', certificate };
  }

  async getById(id: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: {
            user: { select: { fullName: true } },
            course: { select: { title: true } },
          },
        },
      },
    });

    if (!cert) throw new NotFoundException('Sertifikat tidak ditemukan');
    return cert;
  }

  async verify(certificateNumber: string) {
    const cert = await this.prisma.certificate.findUnique({
      where: { certificateNumber },
      include: {
        enrollment: {
          include: {
            user: { select: { fullName: true } },
            course: { select: { title: true } },
          },
        },
      },
    });

    if (!cert) {
      return { valid: false, message: 'Sertifikat tidak ditemukan' };
    }

    return {
      valid: true,
      certificate: {
        certificateNumber: cert.certificateNumber,
        studentName: cert.enrollment.user.fullName,
        courseName: cert.enrollment.course.title,
        issuedAt: cert.issuedAt,
      },
    };
  }

  async getFilePath(id: string): Promise<string> {
    const cert = await this.prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new NotFoundException('Sertifikat tidak ditemukan');
    if (!cert.fileUrl) throw new NotFoundException('File sertifikat belum tersedia');

    const filePath = path.join(process.cwd(), cert.fileUrl);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File sertifikat tidak ditemukan');
    }

    return filePath;
  }

  private generatePDF(
    filePath: string,
    data: {
      studentName: string;
      courseName: string;
      instructorName: string;
      certificateNumber: string;
      issueDate: Date;
      grade?: string;
    },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        layout: 'landscape',
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 60, right: 60 },
      });

      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;

      // Background gradient effect with border
      doc.rect(20, 20, pageWidth - 40, pageHeight - 40)
        .lineWidth(3)
        .strokeColor('#1a365d')
        .stroke();

      doc.rect(30, 30, pageWidth - 60, pageHeight - 60)
        .lineWidth(1)
        .strokeColor('#2b6cb0')
        .stroke();

      // Header - Organization
      doc.fontSize(14)
        .fillColor('#2b6cb0')
        .font('Helvetica')
        .text('LMS BHUANA EDUTECH', 0, 60, { align: 'center' });

      // Title
      doc.moveDown(0.5)
        .fontSize(36)
        .fillColor('#1a365d')
        .font('Helvetica-Bold')
        .text('CERTIFICATE', 0, 90, { align: 'center' });

      doc.fontSize(16)
        .fillColor('#4a5568')
        .font('Helvetica')
        .text('OF COMPLETION', 0, 135, { align: 'center' });

      // Decorative line
      doc.moveTo(pageWidth / 2 - 100, 165)
        .lineTo(pageWidth / 2 + 100, 165)
        .lineWidth(2)
        .strokeColor('#2b6cb0')
        .stroke();

      // Body text
      doc.moveDown(2)
        .fontSize(13)
        .fillColor('#4a5568')
        .font('Helvetica')
        .text('This is to certify that', 0, 185, { align: 'center' });

      // Student name
      doc.moveDown(0.5)
        .fontSize(28)
        .fillColor('#1a365d')
        .font('Helvetica-Bold')
        .text(data.studentName, 0, 210, { align: 'center' });

      // Course completion text
      doc.moveDown(0.5)
        .fontSize(13)
        .fillColor('#4a5568')
        .font('Helvetica')
        .text('has successfully completed the course', 0, 255, { align: 'center' });

      // Course name
      doc.moveDown(0.5)
        .fontSize(22)
        .fillColor('#2b6cb0')
        .font('Helvetica-Bold')
        .text(data.courseName, 0, 280, { align: 'center' });

      // Grade if available
      if (data.grade) {
        doc.moveDown(0.5)
          .fontSize(14)
          .fillColor('#4a5568')
          .font('Helvetica')
          .text(`Grade: ${data.grade}`, 0, 315, { align: 'center' });
      }

      // Date
      const dateStr = data.issueDate.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      doc.moveDown(1)
        .fontSize(12)
        .fillColor('#718096')
        .font('Helvetica')
        .text(`Issued on ${dateStr}`, 0, 345, { align: 'center' });

      // Signature area
      const sigY = 390;

      // Instructor signature
      doc.moveTo(pageWidth / 2 - 80, sigY + 30)
        .lineTo(pageWidth / 2 + 80, sigY + 30)
        .lineWidth(1)
        .strokeColor('#4a5568')
        .stroke();

      doc.fontSize(12)
        .fillColor('#1a365d')
        .font('Helvetica-Bold')
        .text(data.instructorName, 0, sigY + 35, { align: 'center' });

      doc.fontSize(10)
        .fillColor('#718096')
        .font('Helvetica')
        .text('Instructor', 0, sigY + 52, { align: 'center' });

      // Certificate number
      doc.fontSize(8)
        .fillColor('#a0aec0')
        .font('Helvetica')
        .text(
          `Certificate No: ${data.certificateNumber}`,
          0,
          pageHeight - 60,
          { align: 'center' },
        );

      doc.end();

      stream.on('finish', () => resolve());
      stream.on('error', (err) => reject(err));
    });
  }
}
