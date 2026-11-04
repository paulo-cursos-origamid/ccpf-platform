import { ProcessDueDateNotificationsUseCase } from './process-due-date-notifications.use-case';
import { CreateNotificationUseCase } from './create-notification.use-case';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { NotificationSeverity } from '../../domain/enums/notification-severity.enum';

describe('ProcessDueDateNotificationsUseCase', () => {
  let useCase: ProcessDueDateNotificationsUseCase;
  let prisma: {
    installment: { findMany: jest.Mock };
    recurringBillOccurrence: { findMany: jest.Mock };
    financialObligation: { findMany: jest.Mock };
  };
  let createNotification: { execute: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-30T11:00:00.000Z'));

    prisma = {
      installment: { findMany: jest.fn() },
      recurringBillOccurrence: { findMany: jest.fn() },
      financialObligation: { findMany: jest.fn().mockResolvedValue([]) },
    };

    createNotification = {
      execute: jest.fn().mockResolvedValue({}),
    };

    useCase = new ProcessDueDateNotificationsUseCase(
      prisma as unknown as PrismaService,
      createNotification as unknown as CreateNotificationUseCase,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('cria notificações para parcelas vencidas, de hoje e de amanhã', async () => {
    prisma.installment.findMany.mockResolvedValue([
      {
        id: 'installment-yesterday',
        dueDate: new Date('2026-10-29T12:00:00.000Z'),
        installmentNumber: 1,
        plan: {
          userId: 'user-1',
          title: 'Compra parcelada',
          installmentCount: 3,
        },
      },
      {
        id: 'installment-today',
        dueDate: new Date('2026-10-30T12:00:00.000Z'),
        installmentNumber: 2,
        plan: {
          userId: 'user-1',
          title: 'Compra parcelada',
          installmentCount: 3,
        },
      },
      {
        id: 'installment-tomorrow',
        dueDate: new Date('2026-10-31T12:00:00.000Z'),
        installmentNumber: 3,
        plan: {
          userId: 'user-1',
          title: 'Compra parcelada',
          installmentCount: 3,
        },
      },
    ]);

    prisma.recurringBillOccurrence.findMany.mockResolvedValue([]);

    await useCase.execute();

    expect(createNotification.execute).toHaveBeenCalledTimes(3);

    const notifications = createNotification.execute.mock.calls.map(
      ([notification]) => notification,
    );

    expect(notifications).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          resourceId: 'installment-yesterday',
          type: NotificationType.DUE_DATE_OVERDUE,
          severity: NotificationSeverity.ERROR,
          deduplicationKey: 'INSTALLMENT_OVERDUE:installment-yesterday',
        }),
        expect.objectContaining({
          resourceId: 'installment-today',
          type: NotificationType.DUE_DATE_REMINDER,
          severity: NotificationSeverity.WARNING,
          deduplicationKey: 'INSTALLMENT_DUE_TODAY:installment-today',
        }),
        expect.objectContaining({
          resourceId: 'installment-tomorrow',
          type: NotificationType.DUE_DATE_REMINDER,
          severity: NotificationSeverity.INFO,
          deduplicationKey: 'INSTALLMENT_DUE_TOMORROW:installment-tomorrow',
        }),
      ]),
    );
  });

  it('cria notificação para vencimento de conta recorrente', async () => {
    prisma.installment.findMany.mockResolvedValue([]);

    prisma.recurringBillOccurrence.findMany.mockResolvedValue([
      {
        id: 'occurrence-today',
        dueDate: new Date('2026-10-30T12:00:00.000Z'),
        recurringBill: {
          userId: 'user-2',
          title: 'Conta de energia',
        },
      },
    ]);

    await useCase.execute();

    expect(createNotification.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-2',
        resourceType: 'RECURRING_BILL_OCCURRENCE',
        resourceId: 'occurrence-today',
        type: NotificationType.DUE_DATE_REMINDER,
        severity: NotificationSeverity.WARNING,
      }),
    );
  });

  it('cria notificação para compromisso financeiro pendente', async () => {
    prisma.installment.findMany.mockResolvedValue([]);
    prisma.recurringBillOccurrence.findMany.mockResolvedValue([]);
    prisma.financialObligation.findMany.mockResolvedValue([
      {
        id: 'obligation-today',
        userId: 'user-3',
        type: 'RECEIVABLE',
        title: 'Pagamento de cliente',
        dueDate: new Date('2026-10-30T12:00:00.000Z'),
      },
    ]);

    await useCase.execute();

    expect(createNotification.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-3',
        type: NotificationType.DUE_DATE_REMINDER,
        severity: NotificationSeverity.WARNING,
        resourceType: 'FINANCIAL_OBLIGATION',
        resourceId: 'obligation-today',
        deduplicationKey: 'FINANCIAL_OBLIGATION_DUE_TODAY:obligation-today',
      }),
    );
  });

  it('não cria notificações quando não existem vencimentos próximos ou atrasados', async () => {
    prisma.installment.findMany.mockResolvedValue([]);
    prisma.recurringBillOccurrence.findMany.mockResolvedValue([]);
    prisma.financialObligation.findMany.mockResolvedValue([]);

    await useCase.execute();

    expect(createNotification.execute).not.toHaveBeenCalled();
  });
});
