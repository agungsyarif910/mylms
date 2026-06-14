import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { MidtransService } from './midtrans.service';
import { CreatePaymentDto } from './dto/payment.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private midtransService: MidtransService,
  ) {}

  async createPayment(userId: string, dto: CreatePaymentDto) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: {
        course: true,
        user: true,
        payment: true,
      },
    });

    if (!enrollment) throw new NotFoundException('Enrollment tidak ditemukan');
    if (enrollment.userId !== userId) throw new BadRequestException('Akses ditolak');
    if (enrollment.payment?.status === 'PAID') {
      throw new BadRequestException('Pembayaran sudah dilakukan');
    }

    const orderId = `LMS-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const amount = Number(enrollment.course.price);

    // Create Midtrans transaction
    const midtransResult = await this.midtransService.createTransaction({
      orderId,
      amount,
      customerName: enrollment.user.fullName,
      customerEmail: enrollment.user.email,
      customerPhone: enrollment.user.phone || undefined,
      itemName: enrollment.course.title,
    });

    // Upsert payment record
    const payment = enrollment.payment
      ? await this.prisma.payment.update({
          where: { id: enrollment.payment.id },
          data: {
            orderId,
            amount,
            midtransSnapToken: midtransResult.token,
            midtransSnapUrl: midtransResult.redirectUrl,
            status: 'PENDING',
          },
        })
      : await this.prisma.payment.create({
          data: {
            enrollmentId: dto.enrollmentId,
            userId,
            orderId,
            amount,
            midtransSnapToken: midtransResult.token,
            midtransSnapUrl: midtransResult.redirectUrl,
            status: 'PENDING',
          },
        });

    return {
      message: 'Pembayaran berhasil dibuat',
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        snapToken: midtransResult.token,
        snapUrl: midtransResult.redirectUrl,
      },
    };
  }

  async handleWebhook(payload: any) {
    this.logger.log(`Webhook received: ${JSON.stringify(payload)}`);

    // Verify signature
    const isValid = this.midtransService.verifySignature({
      order_id: payload.order_id,
      status_code: payload.status_code,
      gross_amount: payload.gross_amount,
      signature_key: payload.signature_key,
    });

    if (!isValid) {
      this.logger.warn('Invalid webhook signature');
      throw new BadRequestException('Invalid signature');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { orderId: payload.order_id },
    });

    if (!payment) {
      this.logger.warn(`Payment not found: ${payload.order_id}`);
      return { status: 'not_found' };
    }

    const transactionStatus = payload.transaction_status;
    const fraudStatus = payload.fraud_status;

    let newStatus = payment.status;

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        newStatus = 'PAID';
      }
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel') {
      newStatus = 'FAILED';
    } else if (transactionStatus === 'expire') {
      newStatus = 'EXPIRED';
    } else if (transactionStatus === 'refund' || transactionStatus === 'partial_refund') {
      newStatus = 'REFUNDED';
    }

    // Update payment
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        paymentMethod: payload.payment_type,
        midtransTransactionId: payload.transaction_id,
        midtransResponse: payload,
        ...(newStatus === 'PAID' && { paidAt: new Date() }),
        ...(newStatus === 'EXPIRED' && { expiredAt: new Date() }),
      },
    });

    // If paid, activate enrollment
    if (newStatus === 'PAID') {
      await this.prisma.enrollment.update({
        where: { id: payment.enrollmentId },
        data: { status: 'ACTIVE' },
      });
      this.logger.log(`Enrollment activated for payment: ${payment.orderId}`);
    }

    return { status: 'ok' };
  }

  async getPaymentById(id: string, userId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        enrollment: {
          include: { course: { select: { title: true } } },
        },
      },
    });

    if (!payment) throw new NotFoundException('Payment tidak ditemukan');
    if (payment.userId !== userId) throw new BadRequestException('Akses ditolak');

    return payment;
  }

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      include: {
        enrollment: {
          include: { course: { select: { id: true, title: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPayments() {
    return this.prisma.payment.findMany({
      include: {
        enrollment: {
          include: {
            user: { select: { fullName: true, email: true } },
            course: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
