import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { CreateNotificationUseCase } from '../../../../notifications/application/use-cases/create-notification.use-case';
import { NotificationSeverity } from '../../../../notifications/domain/enums/notification-severity.enum';
import { NotificationType } from '../../../../notifications/domain/enums/notification-type.enum';

import { PaymentEntity } from '../../../domain/entities/payment.entity';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import { BillingUnitOfWork } from '../../../domain/repositories/billing-unit-of-work';

/**
 * Cancela somente uma tentativa de pagamento.
 *
 * A notificação é enviada após a transação ser concluída.
 * Falhas na notificação são registradas, mas não transformam
 * um cancelamento já persistido em uma operação aparentemente falha.
 */
@Injectable()
export class CancelPaymentUseCase {
  private readonly logger = new Logger(CancelPaymentUseCase.name);

  constructor(
    private readonly billingUnitOfWork: BillingUnitOfWork,
    private readonly prisma: PrismaService,
    private readonly createNotification: CreateNotificationUseCase,
  ) {}

  async execute(paymentId: string, reason: string): Promise<PaymentEntity> {
    const normalizedReason = reason?.trim();

    if (!normalizedReason || normalizedReason.length < 5) {
      throw new ConflictException(
        'Informe um motivo com pelo menos 5 caracteres para cancelar o pagamento.',
      );
    }

    if (normalizedReason.length > 500) {
      throw new ConflictException(
        'O motivo do cancelamento deve ter no máximo 500 caracteres.',
      );
    }

    // A transação altera somente o pagamento e persiste o motivo.
    const cancelledPayment = await this.billingUnitOfWork.execute(
      async ({
        paymentRepository,
        invoiceInstallmentRepository,
        lockInvoice,
      }) => {
        const initialPayment = await paymentRepository.findById(paymentId);

        if (!initialPayment) {
          throw new NotFoundException('Pagamento não encontrado.');
        }

        const initialInstallment = await invoiceInstallmentRepository.findById(
          initialPayment.installmentId,
        );

        if (!initialInstallment) {
          throw new NotFoundException('Parcela do pagamento não encontrada.');
        }

        await lockInvoice(initialInstallment.invoiceId);

        const payment = await paymentRepository.findById(paymentId);

        if (!payment) {
          throw new NotFoundException('Pagamento não encontrado.');
        }

        if (
          payment.status !== PaymentStatus.PENDING &&
          payment.status !== PaymentStatus.PROCESSING
        ) {
          throw new ConflictException(
            'Somente pagamentos pendentes ou em processamento podem ser cancelados.',
          );
        }

        payment.cancel(normalizedReason);

        return paymentRepository.update(payment);
      },
    );

    // A partir daqui, a transação já foi concluída.
    try {
      const paymentContext = await this.prisma.payment.findUnique({
        where: { id: cancelledPayment.id },
        select: {
          installment: {
            select: {
              invoice: {
                select: {
                  id: true,
                  number: true,
                  tenantId: true,
                },
              },
            },
          },
        },
      });

      if (!paymentContext) {
        throw new Error(
          `Não foi possível localizar a fatura do pagamento ${cancelledPayment.id}.`,
        );
      }

      const invoice = paymentContext.installment.invoice;

      const recipients = await this.prisma.tenantMember.findMany({
        where: {
          tenantId: invoice.tenantId,
          status: 'ACTIVE',
          role: { in: ['OWNER', 'ADMIN'] },
        },
        select: { userId: true },
      });

      const uniqueUserIds = [
        ...new Set(recipients.map(({ userId }) => userId)),
      ];

      const results = await Promise.allSettled(
        uniqueUserIds.map((userId) =>
          this.createNotification.execute({
            userId,
            type: NotificationType.PAYMENT_CANCELLED,
            severity: NotificationSeverity.WARNING,
            title: 'Tentativa de pagamento cancelada',
            message:
              `Não foi possível confirmar o pagamento da fatura ${invoice.number}. ` +
              `Motivo informado: ${normalizedReason}`,
            resourceType: 'PAYMENT',
            resourceId: cancelledPayment.id,
            deduplicationKey: `payment-cancelled:${cancelledPayment.id}`,
          }),
        ),
      );

      const failures = results.filter((result) => result.status === 'rejected');

      if (failures.length > 0) {
        this.logger.error(
          `${failures.length} notificação(ões) de cancelamento não puderam ser criadas ` +
            `para o pagamento ${cancelledPayment.id}.`,
        );
      }
    } catch (error) {
      this.logger.error(
        `O pagamento ${cancelledPayment.id} foi cancelado, mas não foi possível ` +
          'concluir o envio das notificações.',
        error instanceof Error ? error.stack : String(error),
      );
    }

    return cancelledPayment;
  }
}
