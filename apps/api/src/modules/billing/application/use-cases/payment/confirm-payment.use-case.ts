import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PaymentEntity } from '../../../domain/entities/payment.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum';
import { BillingUnitOfWork } from '../../../domain/repositories/billing-unit-of-work';
import { SubscriptionEntity } from '../../../domain/entities/subscription.entity';

export interface ConfirmPaymentInput {
  paymentId: string;
  paidAt?: Date;
}

/**
 * Confirma manualmente um Payment.
 *
 * A confirmação:
 * - quita o Payment;
 * - quita a Invoice;
 * - ativa uma Subscription PENDING;
 * - aplica um upgrade de plano pendente quando a Invoice
 *   estiver vinculada a uma alteração de plano;
 * - mantém toda a operação dentro da mesma transação.
 */
@Injectable()
export class ConfirmPaymentUseCase {
  constructor(private readonly billingUnitOfWork: BillingUnitOfWork) {}

  async execute(input: ConfirmPaymentInput): Promise<PaymentEntity> {
    return this.billingUnitOfWork.execute(
      async ({
        paymentRepository,
        invoiceRepository,
        subscriptionRepository,
        lockInvoice,
      }) => {
        let payment = await paymentRepository.findById(input.paymentId);

        if (!payment) {
          throw new NotFoundException('Pagamento não encontrado.');
        }

        await lockInvoice(payment.invoiceId);

        payment = await paymentRepository.findById(input.paymentId);

        if (!payment) {
          throw new NotFoundException('Pagamento não encontrado.');
        }

        const invoice = await invoiceRepository.findById(payment.invoiceId);

        if (!invoice) {
          throw new NotFoundException('Invoice do pagamento não encontrada.');
        }

        const subscription = await subscriptionRepository.findById(
          invoice.subscriptionId,
        );

        if (!subscription) {
          throw new NotFoundException('Assinatura da Invoice não encontrada.');
        }

        if (payment.isPaid && invoice.isPaid) {
          return payment;
        }

        if (invoice.isPaid && !payment.isPaid) {
          throw new ConflictException(
            'A Invoice já foi quitada por outro pagamento.',
          );
        }

        if (payment.status !== PaymentStatus.PENDING) {
          throw new ConflictException(
            'Somente pagamentos pendentes podem ser confirmados.',
          );
        }

        if (
          invoice.status !== InvoiceStatus.PENDING &&
          invoice.status !== InvoiceStatus.OVERDUE
        ) {
          throw new ConflictException(
            'A Invoice atual não permite confirmação de pagamento.',
          );
        }

        this.validateSubscriptionState(subscription);

        if (Math.abs(payment.amount - invoice.amount) > 0.000001) {
          throw new ConflictException(
            'O valor do pagamento não corresponde ao valor da Invoice.',
          );
        }

        const paidAt = input.paidAt ?? new Date();

        if (paidAt.getTime() > Date.now()) {
          throw new BadRequestException(
            'A data de pagamento não pode estar no futuro.',
          );
        }

        payment.markAsPaid(paidAt);
        invoice.markAsPaid(paidAt);

        if (subscription.pendingPlanInvoiceId === invoice.id) {
          if (!subscription.pendingPlanId) {
            throw new ConflictException(
              'A alteração de plano pendente não possui plano de destino.',
            );
          }

          subscription.applyPendingPlan(paidAt);
        } else if (subscription.status === SubscriptionStatus.PENDING) {
          subscription.activate(paidAt);
        }

        await paymentRepository.update(payment);
        await invoiceRepository.update(invoice);
        await subscriptionRepository.update(subscription);

        return payment;
      },
    );
  }

  private validateSubscriptionState(subscription: SubscriptionEntity): void {
    const allowedStates = [
      SubscriptionStatus.PENDING,
      SubscriptionStatus.ACTIVE,
    ];

    if (!allowedStates.includes(subscription.status)) {
      throw new BadRequestException(
        'A assinatura vinculada à Invoice não pode ser ativada por este pagamento.',
      );
    }
  }
}
