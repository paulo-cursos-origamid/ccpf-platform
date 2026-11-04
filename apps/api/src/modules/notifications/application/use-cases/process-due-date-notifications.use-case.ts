import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { NotificationSeverity } from '../../domain/enums/notification-severity.enum';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { CreateNotificationUseCase } from './create-notification.use-case';

@Injectable()
export class ProcessDueDateNotificationsUseCase {
  private readonly logger = new Logger(ProcessDueDateNotificationsUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly createNotification: CreateNotificationUseCase,
  ) {}

  async execute(): Promise<void> {
    const todayKey = this.dateKeyInTimeZone(new Date(), 'America/Sao_Paulo');
    const tomorrow = new Date(`${todayKey}T00:00:00.000Z`);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const tomorrowKey = this.dateKey(tomorrow);
    const endOfTomorrow = new Date(`${tomorrowKey}T23:59:59.999Z`);

    const [installments, occurrences, obligations] = await Promise.all([
      this.prisma.installment.findMany({
        where: {
          status: { in: ['PENDING', 'OVERDUE'] },
          dueDate: { lte: endOfTomorrow },
          plan: { is: { deletedAt: null } },
        },
        include: {
          plan: {
            select: { userId: true, title: true, installmentCount: true },
          },
        },
      }),
      this.prisma.recurringBillOccurrence.findMany({
        where: {
          status: 'PENDING',
          dueDate: { lte: endOfTomorrow },
          recurringBill: { is: { isActive: true } },
        },
        include: {
          recurringBill: {
            select: { userId: true, title: true },
          },
        },
      }),
      this.prisma.financialObligation.findMany({
        where: {
          status: 'PENDING',
          dueDate: { lte: endOfTomorrow },
        },
        select: {
          id: true,
          userId: true,
          type: true,
          title: true,
          dueDate: true,
        },
      }),
    ]);

    this.logger.log(
      'Vencimentos encontrados: ' +
        installments.length +
        ' parcelas e ' +
        occurrences.length +
        ' contas recorrentes e ' +
        obligations.length +
        ' compromissos financeiros.',
    );

    const notifications = [
      ...installments.map((item) => {
        const dueDate = this.dateKey(item.dueDate);
        const state = this.classify(dueDate, todayKey, tomorrowKey);
        if (!state) return null;

        return {
          userId: item.plan.userId,
          type: state.overdue
            ? NotificationType.DUE_DATE_OVERDUE
            : NotificationType.DUE_DATE_REMINDER,
          severity: state.severity,
          title: state.title,
          message: `A parcela ${item.installmentNumber}/${item.plan.installmentCount} de "${item.plan.title}" ${state.message}.`,
          resourceType: 'INSTALLMENT',
          resourceId: item.id,
          deduplicationKey: `INSTALLMENT_${state.key}:${item.id}`,
        };
      }),
      ...occurrences.map((item) => {
        const dueDate = this.dateKey(item.dueDate);
        const state = this.classify(dueDate, todayKey, tomorrowKey);
        if (!state) return null;

        return {
          userId: item.recurringBill.userId,
          type: state.overdue
            ? NotificationType.DUE_DATE_OVERDUE
            : NotificationType.DUE_DATE_REMINDER,
          severity: state.severity,
          title: state.title,
          message: `A conta recorrente "${item.recurringBill.title}" ${state.message}.`,
          resourceType: 'RECURRING_BILL_OCCURRENCE',
          resourceId: item.id,
          deduplicationKey: `RECURRING_BILL_${state.key}:${item.id}`,
        };
      }),
      ...obligations.map((item) => {
        const dueDate = this.dateKey(item.dueDate);
        const state = this.classify(dueDate, todayKey, tomorrowKey);
        if (!state) return null;

        const direction = item.type === 'PAYABLE' ? 'a pagar' : 'a receber';
        return {
          userId: item.userId,
          type: state.overdue
            ? NotificationType.DUE_DATE_OVERDUE
            : NotificationType.DUE_DATE_REMINDER,
          severity: state.severity,
          title: state.title,
          message: `O compromisso ${direction} "${item.title}" ${state.message}.`,
          resourceType: 'FINANCIAL_OBLIGATION',
          resourceId: item.id,
          deduplicationKey: `FINANCIAL_OBLIGATION_${state.key}:${item.id}`,
        };
      }),
    ].filter((item): item is NonNullable<typeof item> => item !== null);

    const results = await Promise.allSettled(
      notifications.map((notification) =>
        this.createNotification.execute(notification),
      ),
    );

    this.logger.log(
      'Notificações de vencimento processadas: ' + results.length + '.',
    );

    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length) {
      this.logger.error(
        `${failures.length} de ${results.length} notificações de vencimento falharam.`,
      );
    }
  }

  private classify(
    dueDate: string,
    today: string,
    tomorrow: string,
  ): {
    overdue: boolean;
    severity: NotificationSeverity;
    title: string;
    message: string;
    key: string;
  } | null {
    if (dueDate < today) {
      return {
        overdue: true,
        severity: NotificationSeverity.ERROR,
        title: 'Vencimento em atraso',
        message: 'venceu anteriormente e está em atraso',
        key: 'OVERDUE',
      };
    }

    if (dueDate === today) {
      return {
        overdue: false,
        severity: NotificationSeverity.WARNING,
        title: 'Vence hoje',
        message: 'vence hoje',
        key: 'DUE_TODAY',
      };
    }

    if (dueDate === tomorrow) {
      return {
        overdue: false,
        severity: NotificationSeverity.INFO,
        title: 'Vence amanhã',
        message: 'vence amanhã',
        key: 'DUE_TOMORROW',
      };
    }

    return null;
  }

  private dateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private dateKeyInTimeZone(date: Date, timeZone: string): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const values = Object.fromEntries(
      parts.map((part) => [part.type, part.value]),
    );

    return `${values.year}-${values.month}-${values.day}`;
  }
}
