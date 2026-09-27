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

/**
 * Dados necessários para emitir uma Invoice.
 */
export interface CreateInvoiceInput {
  subscriptionId: string;
  dueAt?: Date;
}

/**
 * Caso de uso responsável pela emissão de uma Invoice.
 *
 * Responsabilidades:
 * - localizar a assinatura;
 * - localizar o plano associado;
 * - impedir duplicação de cobrança aberta;
 * - utilizar o preço e a moeda do plano;
 * - gerar o número da Invoice;
 * - persistir a obrigação financeira.
 *
 * A criação da Invoice não cria o Payment.
 * O Payment representa a tentativa/forma de quitação
 * e pertence a um passo posterior do fluxo.
 */
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
      plan.price,
      plan.currency,
      dueAt,
      null,
      now,
      now,
    );

    return this.invoiceRepository.create(invoice);
  }

  /**
   * Define o vencimento padrão quando o chamador
   * não informa uma data específica.
   */
  private calculateDefaultDueAt(start: Date): Date {
    const dueAt = new Date(start);
    dueAt.setDate(dueAt.getDate() + 7);

    return dueAt;
  }

  /**
   * Gera uma referência legível e única para a Invoice.
   *
   * A unicidade final continua protegida pelo @unique
   * existente no banco de dados.
   */
  private generateInvoiceNumber(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = randomUUID()
      .replaceAll('-', '')
      .slice(0, 10)
      .toUpperCase();

    return `INV-${year}${month}-${sequence}`;
  }
}
