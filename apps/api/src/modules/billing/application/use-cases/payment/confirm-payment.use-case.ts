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
import { BillingDateService } from '../../../domain/services/billing-date.service';
import { BillingUnitOfWork } from '../../../domain/repositories/billing-unit-of-work';
import { SubscriptionEntity } from '../../../domain/entities/subscription.entity';
import { CreateNotificationsForPermissionUseCase } from '../../../../notifications/application/use-cases/create-notifications-for-permission.use-case';
import { NotificationSeverity } from '../../../../notifications/domain/enums/notification-severity.enum';
import { NotificationType } from '../../../../notifications/domain/enums/notification-type.enum';

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
  constructor(
    private readonly billingUnitOfWork: BillingUnitOfWork,
    private readonly billingDateService: BillingDateService,
    private readonly createNotificationsForPermissionUseCase: CreateNotificationsForPermissionUseCase,
  ) {}

  async execute(input: ConfirmPaymentInput): Promise<PaymentEntity> {
    const payment = await this.billingUnitOfWork.execute(
      async ({
        paymentRepository,
        invoiceRepository,
        invoiceInstallmentRepository,
        subscriptionRepository,
        planPriceRepository,
        lockInvoice,
        lockSubscription,
      }) => {
        let payment = await paymentRepository.findById(input.paymentId);

        if (!payment) {
          throw new NotFoundException('Pagamento não encontrado.');
        }

        const initialInstallment = await invoiceInstallmentRepository.findById(
          payment.installmentId,
        );

        if (!initialInstallment) {
          throw new NotFoundException('Parcela do pagamento não encontrada.');
        }

        await lockInvoice(initialInstallment.invoiceId);

        payment = await paymentRepository.findById(input.paymentId);

        if (!payment) {
          throw new NotFoundException('Pagamento não encontrado.');
        }

        const installment = await invoiceInstallmentRepository.findById(
          payment.installmentId,
        );

        if (!installment) {
          throw new NotFoundException('Parcela do pagamento não encontrada.');
        }

        const invoice = await invoiceRepository.findById(installment.invoiceId);

        if (!invoice) {
          throw new NotFoundException('Invoice do pagamento não encontrada.');
        }

        await lockSubscription(invoice.subscriptionId);

        const subscription = await subscriptionRepository.findById(
          invoice.subscriptionId,
        );

        if (!subscription) {
          throw new NotFoundException('Assinatura da Invoice não encontrada.');
        }

        if (payment.isPaid && installment.isPaid) {
          /*
           * A confirmação repetida não altera o pagamento nem a parcela.
           * Porém, pode reconciliar uma Invoice legada/inconsistente se
           * todas as parcelas já estiverem efetivamente quitadas.
           */
          const existingInstallments =
            await invoiceInstallmentRepository.findByInvoice(invoice.id);

          const allInstallmentsAlreadyPaid =
            existingInstallments.length > 0 &&
            existingInstallments.every(
              (currentInstallment) => currentInstallment.isPaid,
            );

          if (
            allInstallmentsAlreadyPaid &&
            (invoice.status === InvoiceStatus.PENDING ||
              invoice.status === InvoiceStatus.OVERDUE)
          ) {
            invoice.markAsPaid(
              installment.paidAt ?? payment.paidAt ?? new Date(),
            );
            await invoiceRepository.update(invoice);
          }

          return payment;
        }

        if (installment.isPaid && !payment.isPaid) {
          throw new ConflictException(
            'A parcela já foi quitada por outro pagamento.',
          );
        }

        if (payment.status !== PaymentStatus.PENDING) {
          throw new ConflictException(
            'Somente pagamentos pendentes podem ser confirmados.',
          );
        }

        if (!installment.isPending && !installment.isOverdue) {
          throw new ConflictException(
            'A parcela atual não permite confirmação de pagamento.',
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

        if (Math.abs(payment.amount - installment.amount) > 0.000001) {
          throw new ConflictException(
            'O valor do pagamento não corresponde ao valor da parcela.',
          );
        }

        const paidAt = input.paidAt ?? new Date();

        if (paidAt.getTime() > Date.now()) {
          throw new BadRequestException(
            'A data de pagamento não pode estar no futuro.',
          );
        }

        payment.markAsPaid(paidAt);
        installment.markAsPaid(paidAt);

        const installments = await invoiceInstallmentRepository.findByInvoice(
          invoice.id,
        );

        // A parcela atual já foi marcada como paga em memória, mas ainda não
        // foi persistida. Considerar esse estado evita deixar a fatura aberta
        // quando a última parcela é confirmada.
        const allInstallmentsPaid =
          installments.length > 0 &&
          installments.every(
            (currentInstallment) =>
              currentInstallment.id === installment.id ||
              currentInstallment.isPaid,
          );

        if (allInstallmentsPaid) {
          invoice.markAsPaid(paidAt);
        }

        /*
         * Uma alteração de plano vinculada à Invoice só pode ser
         * efetivada quando a cobrança comercial inteira estiver quitada.
         *
         * Em uma Invoice parcelada, confirmar a primeira parcela
         * não significa que a Invoice foi paga.
         */
        if (
          subscription.pendingPlanInvoiceId === invoice.id &&
          allInstallmentsPaid
        ) {
          if (!subscription.pendingPlanId) {
            throw new ConflictException(
              'A alteração de plano pendente não possui plano de destino.',
            );
          }

          const targetPlanPrice =
            subscription.pendingPlanPriceId === null
              ? null
              : await planPriceRepository.findById(
                  subscription.pendingPlanPriceId,
                );

          if (subscription.pendingPlanPriceId !== null && !targetPlanPrice) {
            throw new ConflictException(
              'A alteração de plano pendente possui uma modalidade comercial inválida.',
            );
          }

          const billingDay =
            targetPlanPrice === null
              ? null
              : this.billingDateService.validateBillingDayForInterval(
                  subscription.pendingBillingDay ?? undefined,
                  targetPlanPrice.interval,
                );

          const currentPeriodStart = paidAt;

          const currentPeriodEnd =
            targetPlanPrice === null
              ? paidAt
              : (this.billingDateService.calculatePeriodEnd(
                  currentPeriodStart,
                  targetPlanPrice.interval,
                  billingDay,
                ) ?? currentPeriodStart);

          const nextBillingDate =
            targetPlanPrice === null
              ? null
              : this.billingDateService.calculateNextBillingDate(
                  currentPeriodStart,
                  billingDay,
                  targetPlanPrice.interval,
                );

          subscription.applyPendingPlan(
            billingDay,
            nextBillingDate,
            currentPeriodStart,
            currentPeriodEnd,
            paidAt,
          );
        } else if (
          subscription.status === SubscriptionStatus.PENDING &&
          installment.number === 1
        ) {
          /*
           * A assinatura criada como PENDING ganha acesso comercial
           * após a confirmação da primeira parcela.
           *
           * As demais parcelas pertencem ao ciclo financeiro da Invoice
           * e não devem reativar ou alterar a Subscription novamente.
           */
          subscription.activate(paidAt);
        }

        await paymentRepository.update(payment);
        await invoiceInstallmentRepository.update(installment);

        if (allInstallmentsPaid) {
          await invoiceRepository.update(invoice);
        }

        await subscriptionRepository.update(subscription);

        return payment;
      },
    );

    await this.createNotificationsForPermissionUseCase.execute({
      permissionCode: 'BILLING_MANAGE',
      type: NotificationType.PAYMENT_CONFIRMED,
      severity: NotificationSeverity.SUCCESS,
      title: 'Pagamento confirmado',
      message: 'Um pagamento foi confirmado com sucesso.',
      resourceType: 'PAYMENT',
      resourceId: payment.id,
      deduplicationKey: `PAYMENT_CONFIRMED:${payment.id}`,
    });

    return payment;
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
