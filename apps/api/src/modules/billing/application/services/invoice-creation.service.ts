import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { InvoiceEntity } from '../../domain/entities/invoice.entity';
import { InvoiceInstallmentScheduleService } from '../../domain/services/invoice-installment-schedule.service';
import { InvoiceInstallmentRepository } from '../../domain/repositories/invoice-installment.repository';
import { InvoiceStatus } from '../../domain/enums/invoice-status.enum';
import { SubscriptionStatus } from '../../domain/enums/subscription-status.enum';
import { InvoiceRepository } from '../../domain/repositories/invoice.repository';
import { PlanPriceRepository } from '../../domain/repositories/plan-price.repository';
import { PlanRepository } from '../../domain/repositories/plan.repository';
import { SubscriptionRepository } from '../../domain/repositories/subscription.repository';

export interface CreateInvoiceServiceInput {
  subscriptionId: string;
  dueAt?: Date;
  amount?: number;
  installmentCount?: number;
}

/**
 * Serviço responsável pela regra de criação de Invoice.
 *
 * Responsabilidades:
 * - validar a Subscription;
 * - impedir múltiplas Invoices abertas;
 * - resolver Plano e PlanPrice;
 * - calcular valor e vencimento;
 * - criar a Invoice usando os repositórios fornecidos.
 *
 * O serviço não abre transações.
 * A transação é responsabilidade do caso de uso que o invoca.
 */
@Injectable()
export class InvoiceCreationService {
  async execute(
    input: CreateInvoiceServiceInput,
    repositories: {
      invoiceRepository: InvoiceRepository;
      planRepository: PlanRepository;
      planPriceRepository: PlanPriceRepository;
      subscriptionRepository: SubscriptionRepository;
      invoiceInstallmentRepository: InvoiceInstallmentRepository;
    },
  ): Promise<InvoiceEntity> {
    const {
      invoiceRepository,
      planRepository,
      planPriceRepository,
      subscriptionRepository,
      invoiceInstallmentRepository,
    } = repositories;

    const subscription = await subscriptionRepository.findById(
      input.subscriptionId,
    );

    if (!subscription) {
      throw new NotFoundException('Assinatura não encontrada.');
    }

    if (
      subscription.status !== SubscriptionStatus.PENDING &&
      subscription.status !== SubscriptionStatus.ACTIVE &&
      subscription.status !== SubscriptionStatus.PAST_DUE
    ) {
      throw new BadRequestException(
        'A assinatura atual não permite a emissão de uma Invoice.',
      );
    }

    const existingInvoices = await invoiceRepository.findBySubscription(
      subscription.id,
    );

    const openInvoice = existingInvoices.find(
      (invoice) =>
        invoice.status === InvoiceStatus.PENDING ||
        invoice.status === InvoiceStatus.OVERDUE,
    );

    if (openInvoice) {
      throw new ConflictException(
        'A assinatura já possui uma Invoice em aberto.',
      );
    }

    const plan = await planRepository.findById(subscription.planId);

    if (!plan) {
      throw new NotFoundException(
        'Plano associado à assinatura não encontrado.',
      );
    }

    const planPrice = subscription.planPriceId
      ? await planPriceRepository.findById(subscription.planPriceId)
      : null;

    if (!planPrice) {
      throw new BadRequestException(
        'A assinatura não possui uma modalidade comercial válida.',
      );
    }

    const amount = input.amount ?? planPrice.amount;

    if (amount <= 0) {
      throw new BadRequestException(
        'O valor da Invoice deve ser maior que zero.',
      );
    }

    const now = new Date();
    const dueAt = input.dueAt ?? this.calculateDefaultDueAt(now);

    if (dueAt.getTime() <= now.getTime()) {
      throw new BadRequestException(
        'A data de vencimento da Invoice deve ser futura.',
      );
    }

    const installmentCount = input.installmentCount ?? 1;

    InvoiceInstallmentScheduleService.validateInstallmentCount(
      installmentCount,
    );

    const invoice = new InvoiceEntity(
      randomUUID(),
      subscription.tenantId,
      subscription.id,
      this.generateInvoiceNumber(now),
      InvoiceStatus.PENDING,
      amount,
      planPrice.currency,
      dueAt,
      null,
      now,
      now,
      installmentCount,
    );

    const createdInvoice = await invoiceRepository.create(invoice);

    const installments =
      InvoiceInstallmentScheduleService.create(createdInvoice);

    await invoiceInstallmentRepository.createMany(installments);

    return createdInvoice;
  }

  private calculateDefaultDueAt(referenceDate: Date): Date {
    const dueAt = new Date(referenceDate);
    dueAt.setDate(dueAt.getDate() + 7);

    return dueAt;
  }

  private generateInvoiceNumber(referenceDate: Date): string {
    const year = referenceDate.getFullYear();
    const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
    const suffix = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();

    return `CCPF-${year}-${month}-${suffix}`;
  }
}
