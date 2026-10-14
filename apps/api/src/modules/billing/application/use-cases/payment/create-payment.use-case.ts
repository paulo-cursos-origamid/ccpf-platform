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

import { InvoiceInstallmentEntity } from '../../../domain/entities/invoice-installment.entity';
import { InvoiceEntity } from '../../../domain/entities/invoice.entity';
import { InvoiceInstallmentStatus } from '../../../domain/enums/invoice-installment-status.enum';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { PaymentEntity } from '../../../domain/entities/payment.entity';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { InvoiceInstallmentRepository } from '../../../domain/repositories/invoice-installment.repository';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository';
import { PaymentRepository } from '../../../domain/repositories/payment.repository';

import { ManualPaymentInstrumentService } from '../../services/manual-payment-instrument.service';

import { CreateNotificationsForPermissionUseCase } from '../../../../notifications/application/use-cases/create-notifications-for-permission.use-case';
import { NotificationSeverity } from '../../../../notifications/domain/enums/notification-severity.enum';
import { NotificationType } from '../../../../notifications/domain/enums/notification-type.enum';

/**
 * Dados necessários para criar uma tentativa de pagamento.
 *
 * O valor e os dados do instrumento são derivados da parcela
 * pelo backend. O cliente informa somente qual parcela deseja
 * pagar e o método escolhido.
 */
export interface CreatePaymentInput {
  tenantId: string;
  userId: string;
  invoiceId: string;
  installmentId: string;
  method: PaymentMethod;
  expiresAt?: Date;
  externalReference?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Caso de uso responsável pela criação de uma tentativa
 * de pagamento para uma parcela da Invoice.
 *
 * Regras:
 * - somente OWNER pode criar uma tentativa;
 * - a Invoice precisa pertencer ao Tenant ativo;
 * - a Invoice precisa estar aberta;
 * - a parcela precisa pertencer à Invoice;
 * - a parcela precisa estar PENDING ou OVERDUE;
 * - o valor do Payment é sempre o valor da parcela;
 * - PIX e boleto são gerados pelo backend;
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
    private readonly invoiceInstallmentRepository: InvoiceInstallmentRepository,
    private readonly paymentRepository: PaymentRepository,
    private readonly manualPaymentInstrumentService: ManualPaymentInstrumentService,

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

    const installment = await this.invoiceInstallmentRepository.findById(
      input.installmentId,
    );

    if (!installment) {
      throw new NotFoundException('Parcela não encontrada.');
    }

    this.validateInstallment(invoice, installment);

    if (input.expiresAt && input.expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException(
        'A data de expiração do pagamento deve ser futura.',
      );
    }

    const now = new Date();
    const reference = this.generatePaymentReference(now);

    const instruments = this.generatePaymentInstrument(
      input.method,
      installment.amount,
      reference,
    );

    const payment = new PaymentEntity(
      randomUUID(),
      installment.id,
      reference,
      input.method,
      PaymentStatus.PENDING,
      installment.amount,
      installment.currency,
      null,
      input.expiresAt ?? installment.dueAt,
      'MANUAL',
      null,
      input.externalReference ?? null,
      instruments.pixCopyPaste,
      instruments.bankSlipBarcode,
      instruments.bankSlipDigitableLine,
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
        message: `Uma nova tentativa de pagamento foi criada para a parcela ${installment.number}/${installment.totalCount} da Invoice ${invoice.id}.`,
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
   * Garante que a parcela pertence à Invoice solicitada
   * e está em estado que permite uma nova tentativa.
   */
  private validateInstallment(
    invoice: InvoiceEntity,
    installment: InvoiceInstallmentEntity,
  ): void {
    if (installment.invoiceId !== invoice.id) {
      throw new ForbiddenException(
        'A parcela não pertence à Invoice informada.',
      );
    }

    if (
      installment.status !== InvoiceInstallmentStatus.PENDING &&
      installment.status !== InvoiceInstallmentStatus.OVERDUE
    ) {
      throw new BadRequestException(
        'Somente parcelas PENDING ou OVERDUE podem receber pagamentos.',
      );
    }
  }

  /**
   * Gera os dados do instrumento exclusivamente no backend.
   */
  private generatePaymentInstrument(
    method: PaymentMethod,
    amount: number,
    reference: string,
  ): {
    pixCopyPaste: string | null;
    bankSlipBarcode: string | null;
    bankSlipDigitableLine: string | null;
  } {
    if (method === PaymentMethod.PIX) {
      return {
        pixCopyPaste: this.manualPaymentInstrumentService.generatePixCopyPaste(
          amount,
          reference,
        ),
        bankSlipBarcode: null,
        bankSlipDigitableLine: null,
      };
    }

    const bankSlipBarcode =
      this.manualPaymentInstrumentService.generateBankSlipBarcode(
        amount,
        reference,
      );

    return {
      pixCopyPaste: null,
      bankSlipBarcode,
      bankSlipDigitableLine:
        this.manualPaymentInstrumentService.generateBankSlipDigitableLine(
          bankSlipBarcode,
        ),
    };
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
