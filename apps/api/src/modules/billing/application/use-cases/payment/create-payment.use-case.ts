import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { TenantMemberStatus } from '../../../../tenant/domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../../tenant/domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';

import { InvoiceEntity } from '../../../domain/entities/invoice.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { PaymentEntity } from '../../../domain/entities/payment.entity';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository';
import { PaymentRepository } from '../../../domain/repositories/payment.repository';

import { CreateNotificationsForPermissionUseCase } from '../../../../notifications/application/use-cases/create-notifications-for-permission.use-case';
import { NotificationSeverity } from '../../../../notifications/domain/enums/notification-severity.enum';
import { NotificationType } from '../../../../notifications/domain/enums/notification-type.enum';

/**
 * Dados necessários para criar uma tentativa de pagamento.
 */
export interface CreatePaymentInput {
  tenantId: string;
  userId: string;
  invoiceId: string;
  method: PaymentMethod;
  expiresAt?: Date;
  externalReference?: string;
  pixCopyPaste?: string;
  bankSlipBarcode?: string;
  bankSlipDigitableLine?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Caso de uso responsável pela criação de uma tentativa
 * de pagamento para uma Invoice.
 *
 * Regras:
 * - somente OWNER pode criar uma tentativa;
 * - a Invoice precisa pertencer ao Tenant ativo;
 * - a Invoice precisa estar aberta;
 * - PIX exige pixCopyPaste;
 * - BANK_SLIP exige barcode ou digitable line;
 * - o provedor atual é MANUAL.
 *
 * A confirmação do pagamento pertence a outro caso de uso.
 */
@Injectable()
export class CreatePaymentUseCase {
  private readonly logger = new Logger(CreatePaymentUseCase.name);

  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
    private readonly invoiceRepository: InvoiceRepository,
    private readonly paymentRepository: PaymentRepository,

    private readonly createNotificationsForPermissionUseCase: CreateNotificationsForPermissionUseCase,
  ) {}

  async execute(input: CreatePaymentInput): Promise<PaymentEntity> {
    const member = await this.tenantMemberRepository.findByTenantAndUser(
      input.tenantId,
      input.userId,
    );

    if (!member) {
      throw new ForbiddenException('User does not belong to this Tenant');
    }

    if (member.status !== TenantMemberStatus.ACTIVE) {
      throw new ForbiddenException('User access to this Tenant is not active');
    }

    if (member.role !== TenantRole.OWNER) {
      throw new ForbiddenException(
        'Only the Tenant OWNER can create a payment',
      );
    }

    const invoice = await this.invoiceRepository.findById(input.invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice não encontrada.');
    }

    if (invoice.tenantId !== input.tenantId) {
      throw new ForbiddenException('A Invoice não pertence ao Tenant ativo.');
    }

    this.validateInvoice(invoice);
    this.validatePaymentMethod(input);

    if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'A data de expiração do pagamento deve ser futura.',
      );
    }

    const now = new Date();

    const payment = new PaymentEntity(
      randomUUID(),
      invoice.id,
      this.generatePaymentReference(now),
      input.method,
      PaymentStatus.PENDING,
      invoice.amount,
      invoice.currency,
      null,
      input.expiresAt ?? null,
      'MANUAL',
      null,
      input.externalReference ?? null,
      input.pixCopyPaste ?? null,
      input.bankSlipBarcode ?? null,
      input.bankSlipDigitableLine ?? null,
      input.metadata ?? null,
      now,
      now,
    );

    const createdPayment = await this.paymentRepository.create(payment);

    try {
      await this.createNotificationsForPermissionUseCase.execute({
        permissionCode: 'BILLING_MANAGE',
        type: NotificationType.PAYMENT_PENDING,
        severity: NotificationSeverity.WARNING,
        title: 'Pagamento pendente',
        message: `Uma nova tentativa de pagamento foi criada para a Invoice ${invoice.id}.`,
        resourceType: 'INVOICE',
        resourceId: invoice.id,
        deduplicationKey: `PAYMENT_PENDING:${createdPayment.id}`,
      });
    } catch (error) {
      this.logger.error(
        `Não foi possível criar a notificação de pagamento pendente para o Payment ${createdPayment.id}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    return createdPayment;
  }

  /**
   * Somente Invoices abertas podem receber uma nova
   * tentativa de pagamento.
   */
  private validateInvoice(invoice: InvoiceEntity): void {
    if (
      invoice.status !== InvoiceStatus.PENDING &&
      invoice.status !== InvoiceStatus.OVERDUE
    ) {
      throw new BadRequestException(
        'Somente Invoices PENDING ou OVERDUE podem receber pagamentos.',
      );
    }
  }

  /**
   * Valida os dados específicos do instrumento escolhido.
   */
  private validatePaymentMethod(input: CreatePaymentInput): void {
    if (input.method === PaymentMethod.PIX && !input.pixCopyPaste) {
      throw new BadRequestException(
        'O pagamento PIX precisa informar o código copia e cola.',
      );
    }

    if (
      input.method === PaymentMethod.BANK_SLIP &&
      !input.bankSlipBarcode &&
      !input.bankSlipDigitableLine
    ) {
      throw new BadRequestException(
        'O boleto precisa informar o código de barras ou a linha digitável.',
      );
    }
  }

  /**
   * Gera uma referência interna única para o Payment.
   */
  private generatePaymentReference(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = randomUUID()
      .replaceAll('-', '')
      .slice(0, 10)
      .toUpperCase();

    return `PAY-${year}${month}-${sequence}`;
  }
}
