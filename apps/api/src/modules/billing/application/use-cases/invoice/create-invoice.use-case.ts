import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { InvoiceEntity } from '../../../domain/entities/invoice.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository';
import { PlanRepository } from '../../../domain/repositories/plan.repository';
import { SubscriptionRepository } from '../../../domain/repositories/subscription.repository';

export interface CreateInvoiceInput {
  subscriptionId: string;
  dueAt?: Date;
  amount?: number;
}

@Injectable()
export class CreateInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly planRepository: PlanRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {}

  async execute(input: CreateInvoiceInput): Promise<InvoiceEntity> {
    const subscription = await this.subscriptionRepository.findById(
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

    const existingInvoices = await this.invoiceRepository.findBySubscription(
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

    const plan = await this.planRepository.findById(subscription.planId);

    if (!plan) {
      throw new NotFoundException(
        'Plano associado à assinatura não encontrado.',
      );
    }

    const amount = input.amount ?? plan.price;

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

    const invoice = new InvoiceEntity(
      randomUUID(),
      subscription.tenantId,
      subscription.id,
      this.generateInvoiceNumber(now),
      InvoiceStatus.PENDING,
      amount,
      plan.currency,
      dueAt,
      null,
      now,
      now,
    );

    return this.invoiceRepository.create(invoice);
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
