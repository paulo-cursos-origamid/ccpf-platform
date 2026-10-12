import { Injectable, NotFoundException } from '@nestjs/common';

import { InvoiceEntity } from '../../../domain/entities/invoice.entity';
import { BillingUnitOfWork } from '../../../domain/repositories/billing-unit-of-work';
import { InvoiceCreationService } from '../../services/invoice-creation.service';

export interface CreateInvoiceInput {
  subscriptionId: string;
  dueAt?: Date;
  amount?: number;
  installmentCount?: number;
}

/**
 * Caso de uso responsável pela criação transacional de uma Invoice.
 *
 * Responsabilidades:
 * - abrir a transação financeira;
 * - bloquear a Subscription para evitar emissões concorrentes;
 * - delegar as regras de criação ao InvoiceCreationService;
 * - garantir que todos os repositórios utilizados pertencem à mesma transação.
 */
@Injectable()
export class CreateInvoiceUseCase {
  constructor(
    private readonly billingUnitOfWork: BillingUnitOfWork,
    private readonly invoiceCreationService: InvoiceCreationService,
  ) {}

  async execute(input: CreateInvoiceInput): Promise<InvoiceEntity> {
    return this.billingUnitOfWork.execute(async (context) => {
      await context.lockSubscription(input.subscriptionId);

      const subscription = await context.subscriptionRepository.findById(
        input.subscriptionId,
      );

      if (!subscription) {
        throw new NotFoundException('Assinatura não encontrada.');
      }

      return this.invoiceCreationService.execute(input, {
        invoiceRepository: context.invoiceRepository,
        planRepository: context.planRepository,
        planPriceRepository: context.planPriceRepository,
        subscriptionRepository: context.subscriptionRepository,
        invoiceInstallmentRepository: context.invoiceInstallmentRepository,
      });
    });
  }
}
