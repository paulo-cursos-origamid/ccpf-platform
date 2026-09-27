import { Inject, Injectable } from '@nestjs/common';
import {
  PaymentMethod as PrismaPaymentMethod,
  PaymentStatus as PrismaPaymentStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { PaymentEntity } from '../../domain/entities/payment.entity';
import { PaymentMethod } from '../../domain/enums/payment-method.enum';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { PaymentRepository } from '../../domain/repositories/payment.repository';

/**
 * Implementação Prisma do repositório de Payment.
 *
 * Responsável por traduzir os registros persistidos pelo Prisma
 * para entidades pertencentes ao domínio de Billing.
 *
 * O domínio não conhece Prisma nem os enums gerados pelo ORM.
 */
@Injectable()
export class PrismaPaymentRepository implements PaymentRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService | Prisma.TransactionClient,
  ) {}

  async create(payment: PaymentEntity): Promise<PaymentEntity> {
    const createdPayment = await this.prisma.payment.create({
      data: {
        id: payment.id,
        invoiceId: payment.invoiceId,
        reference: payment.reference,
        method: payment.method,
        status: payment.status,
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

    return this.toDomain(createdPayment);
  }

  async findById(id: string): Promise<PaymentEntity | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      return null;
    }

    return this.toDomain(payment);
  }

  async findByReference(reference: string): Promise<PaymentEntity | null> {
    const payment = await this.prisma.payment.findUnique({
      where: { reference },
    });

    if (!payment) {
      return null;
    }

    return this.toDomain(payment);
  }

  async findByInvoice(invoiceId: string): Promise<PaymentEntity[]> {
    const payments = await this.prisma.payment.findMany({
      where: {
        invoiceId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return payments.map((payment) => this.toDomain(payment));
  }

  async update(payment: PaymentEntity): Promise<PaymentEntity> {
    const updatedPayment = await this.prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: payment.status,
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

    return this.toDomain(updatedPayment);
  }

  /**
   * Converte um registro Prisma em uma entidade do domínio.
   */
  private toDomain(rawPayment: {
    id: string;
    invoiceId: string;
    reference: string;
    method: PrismaPaymentMethod;
    status: PrismaPaymentStatus;
    amount: { toNumber(): number };
    currency: string;
    paidAt: Date | null;
    expiresAt: Date | null;
    provider: string | null;
    providerPaymentId: string | null;
    externalReference: string | null;
    pixCopyPaste: string | null;
    bankSlipBarcode: string | null;
    bankSlipDigitableLine: string | null;
    metadata: Prisma.JsonValue | null;
    createdAt: Date;
    updatedAt: Date;
  }): PaymentEntity {
    return new PaymentEntity(
      rawPayment.id,
      rawPayment.invoiceId,
      rawPayment.reference,
      rawPayment.method as PaymentMethod,
      rawPayment.status as PaymentStatus,
      rawPayment.amount.toNumber(),
      rawPayment.currency,
      rawPayment.paidAt,
      rawPayment.expiresAt,
      rawPayment.provider,
      rawPayment.providerPaymentId,
      rawPayment.externalReference,
      rawPayment.pixCopyPaste,
      rawPayment.bankSlipBarcode,
      rawPayment.bankSlipDigitableLine,
      this.toMetadata(rawPayment.metadata),
      rawPayment.createdAt,
      rawPayment.updatedAt,
    );
  }

  /**
   * Converte o JSON persistido pelo Prisma para o formato
   * utilizado pela entidade de domínio.
   *
   * O Billing trabalha com metadata como objeto.
   */
  private toMetadata(
    metadata: Prisma.JsonValue | null,
  ): Record<string, unknown> | null {
    if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') {
      return null;
    }

    return metadata;
  }
}
