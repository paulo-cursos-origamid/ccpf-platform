import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PaymentEntity } from '../../domain/entities/payment.entity';
import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { PaymentRepository } from '../../domain/repositories/payment.repository';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async create(payment: PaymentEntity): Promise<PaymentEntity> {
    const created = await this.prisma.payment.create({
      data: {
        id: payment.id,
        installmentId: payment.installmentId,
        reference: payment.reference,
        method: payment.method,
        status: payment.status,
        cancellationReason: payment.cancellationReason,
        amount: payment.amount,
        currency: payment.currency,
        paidAt: payment.paidAt,
        expiresAt: payment.expiresAt,
        provider: payment.provider,
        providerPaymentId: payment.providerPaymentId,
        externalReference: payment.externalReference,
        pixCopyPaste: payment.pixCopyPaste,
        bankSlipBarcode: payment.bankSlipBarcode,
        bankSlipDigitableLine: payment.bankSlipDigitableLine,
        metadata:
          payment.metadata === null
            ? Prisma.JsonNull
            : (payment.metadata as Prisma.InputJsonValue),
      },
    });

    return this.toDomain(created);
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    return payment ? this.toDomain(payment) : null;
  }

  async findByReference(reference: string): Promise<PaymentEntity | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
    });

    return payment ? this.toDomain(payment) : null;
  }

  async findByInstallment(installmentId: string): Promise<PaymentEntity[]> {
    const payments = await this.prisma.payment.findMany({
      where: { installmentId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => this.toDomain(payment));
  }

  async update(payment: PaymentEntity): Promise<PaymentEntity> {
    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: payment.status,
        paidAt: payment.paidAt,
        cancellationReason: payment.cancellationReason,
        updatedAt: payment.updatedAt,
      },
    });

    return this.toDomain(updated);
  }

  private toDomain(raw: {
    id: string;
    installmentId: string;
    reference: string;
    method: string;
    status: string;
    amount: unknown;
    currency: string;
    paidAt: Date | null;
    expiresAt: Date | null;
    provider: string | null;
    providerPaymentId: string | null;
    externalReference: string | null;
    pixCopyPaste: string | null;
    bankSlipBarcode: string | null;
    bankSlipDigitableLine: string | null;
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
    cancellationReason: string | null;
  }): PaymentEntity {
    return new PaymentEntity(
      raw.id,
      raw.installmentId,
      raw.reference,
      raw.method as PaymentMethod,
      raw.status as PaymentStatus,
      Number(raw.amount),
      raw.currency,
      raw.paidAt,
      raw.expiresAt,
      raw.provider,
      raw.providerPaymentId,
      raw.externalReference,
      raw.pixCopyPaste,
      raw.bankSlipBarcode,
      raw.bankSlipDigitableLine,
      raw.metadata && typeof raw.metadata === 'object'
        ? (raw.metadata as Record<string, unknown>)
        : null,
      raw.createdAt,
      raw.updatedAt,
      raw.cancellationReason,
    );
  }
}
