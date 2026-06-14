import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    oldValues?: any;
    newValues?: any;
    ipAddress?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValues: params.oldValues,
        newValues: params.newValues,
        ipAddress: params.ipAddress,
      },
    });
  }

  async getAuditLogs(options?: { entityType?: string; userId?: string; limit?: number }) {
    return this.prisma.auditLog.findMany({
      where: {
        ...(options?.entityType && { entityType: options.entityType }),
        ...(options?.userId && { userId: options.userId }),
      },
      include: {
        user: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
    });
  }
}
