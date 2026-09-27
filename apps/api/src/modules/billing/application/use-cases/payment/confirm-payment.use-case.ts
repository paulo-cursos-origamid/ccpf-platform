import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PaymentEntity } from '../../../domain/entities/payment.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum';
import { BillingUnitOfWork } from '../../../domain/repositories/billing-unit-of-work';
import { SubscriptionEntity } from '../../../domain/entities/subscription.entity';

/**
 * Dados necessários para confirmar um pagamento.
 */
export interface ConfirmPaymentInput {
  paymentId: string;
  paidAt?: Date;
}

/**
 * Caso de uso responsável pela confirmação financeira
 * de um Payment.
 *
 * Toda a operação ocorre dentro de uma única transação:
 *
 * Payment PAID
 *      ↓
 * Invoice PAID
 *      ↓
 * Subscription ACTIVE
 *
 * A Invoice é bloqueada durante a confirmação para impedir
 * que duas tentativas de pagamento quitem a mesma Invoice
 * simultaneamente.
 *
 * O caso de uso permanece independente do provedor.
 * No futuro, um webhook de gateway poderá chamar este mesmo
 * fluxo de confirmação.
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
        /**
         * A primeira leitura identifica a Invoice associada
         * ao Payment para podermos aplicar o lock correto.
         */
        let payment = await paymentRepository.findById(input.paymentId);

        if (!payment) {
          throw new NotFoundException('Pagamento não encontrado.');
        }

        await lockInvoice(payment.invoiceId);

        /**
         * Releitura obrigatória após adquirir o lock.
         *
         * Isso garante que todas as regras sejam avaliadas
         * sobre o estado serializado da Invoice.
         */
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

        /**
         * Idempotência:
         *
         * Se este mesmo Payment já foi confirmado e a Invoice
         * continua quitada, a chamada retorna o estado atual
         * sem executar novas alterações.
         */
        if (payment.isPaid && invoice.isPaid) {
          return payment;
        }

        /**
         * Outra tentativa já quitou a Invoice.
         */
        if (invoice.isPaid && !payment.isPaid) {
          throw new BadRequestException(
            'A Invoice já foi quitada por outro pagamento.',
          );
        }

        if (
          payment.status === PaymentStatus.CANCELLED ||
          payment.status === PaymentStatus.FAILED ||
          payment.status === PaymentStatus.REFUNDED
        ) {
          throw new BadRequestException(
            'O pagamento atual não pode ser confirmado neste estado.',
          );
        }

        if (invoice.isCancelled) {
          throw new BadRequestException(
            'Uma Invoice cancelada não pode ser quitada.',
          );
        }

        if (Math.abs(payment.amount - invoice.amount) > 0.000001) {
          throw new BadRequestException(
            'O valor do pagamento não corresponde ao valor da Invoice.',
          );
        }

        this.validateSubscriptionState(subscription);

        const paidAt = input.paidAt ?? new Date();

        if (paidAt.getTime() > Date.now()) {
          throw new BadRequestException(
            'A data de pagamento não pode estar no futuro.',
          );
        }

        /**
         * As entidades continuam responsáveis pelas
         * transições de estado do domínio.
         */
        payment.markAsPaid(paidAt);
        invoice.markAsPaid(paidAt);

        if (subscription.status === SubscriptionStatus.PENDING) {
          subscription.activate(paidAt);
        }

        /**
         * As três escritas usam os repositórios ligados
         * ao mesmo transaction client.
         *
         * Se qualquer operação falhar, o Prisma executará
         * rollback de toda a transação.
         */
        await paymentRepository.update(payment);
        await invoiceRepository.update(invoice);
        await subscriptionRepository.update(subscription);

        return payment;
      },
    );
  }

  /**
   * Impede que uma confirmação de pagamento tente
   * reativar uma assinatura em estado incompatível.
   */
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
