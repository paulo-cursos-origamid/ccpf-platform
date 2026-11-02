import { NotificationSeverity } from '../../domain/enums/notification-severity.enum';
import { NotificationType } from '../../domain/enums/notification-type.enum';
import { NotificationRecipientRepository } from '../../domain/repositories/notification-recipient.repository';
import { CreateNotificationUseCase } from './create-notification.use-case';
import { CreateNotificationsForPermissionUseCase } from './create-notifications-for-permission.use-case';

describe('CreateNotificationsForPermissionUseCase', () => {
  let useCase: CreateNotificationsForPermissionUseCase;

  let notificationRecipientRepository: {
    findUserIdsByPermission: jest.Mock;
  };

  let createNotificationUseCase: {
    execute: jest.Mock;
  };

  const input = {
    permissionCode: 'BILLING_MANAGE',
    type: NotificationType.PAYMENT_PENDING,
    severity: NotificationSeverity.INFO,
    title: 'Pagamento pendente',
    message: 'Um pagamento está pendente.',
    resourceType: 'INVOICE',
    resourceId: 'invoice-1',
    deduplicationKey: 'PAYMENT_PENDING:invoice-1',
  };

  beforeEach(() => {
    notificationRecipientRepository = {
      findUserIdsByPermission: jest.fn(),
    };

    createNotificationUseCase = {
      execute: jest.fn().mockResolvedValue({}),
    };

    useCase = new CreateNotificationsForPermissionUseCase(
      notificationRecipientRepository as unknown as NotificationRecipientRepository,
      createNotificationUseCase as unknown as CreateNotificationUseCase,
    );
  });

  it('deve criar notificações para todos os destinatários encontrados', async () => {
    notificationRecipientRepository.findUserIdsByPermission.mockResolvedValue([
      'user-1',
      'user-2',
    ]);

    const result = await useCase.execute(input);

    expect(result).toEqual({ recipients: 2 });

    expect(
      notificationRecipientRepository.findUserIdsByPermission,
    ).toHaveBeenCalledWith('BILLING_MANAGE');

    expect(createNotificationUseCase.execute).toHaveBeenCalledTimes(2);
    expect(createNotificationUseCase.execute).toHaveBeenNthCalledWith(1, {
      userId: 'user-1',
      type: input.type,
      severity: input.severity,
      title: input.title,
      message: input.message,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      deduplicationKey: input.deduplicationKey,
    });
    expect(createNotificationUseCase.execute).toHaveBeenNthCalledWith(2, {
      userId: 'user-2',
      type: input.type,
      severity: input.severity,
      title: input.title,
      message: input.message,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      deduplicationKey: input.deduplicationKey,
    });
  });

  it('deve preservar a operação quando a criação falhar para parte dos destinatários', async () => {
    notificationRecipientRepository.findUserIdsByPermission.mockResolvedValue([
      'user-1',
      'user-2',
      'user-3',
    ]);

    createNotificationUseCase.execute
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('Falha ao criar notificação'))
      .mockResolvedValueOnce({});

    const result = await useCase.execute(input);

    expect(result).toEqual({ recipients: 3 });
    expect(createNotificationUseCase.execute).toHaveBeenCalledTimes(3);
  });

  it('deve retornar zero quando não houver destinatários', async () => {
    notificationRecipientRepository.findUserIdsByPermission.mockResolvedValue(
      [],
    );

    const result = await useCase.execute(input);

    expect(result).toEqual({ recipients: 0 });
    expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
  });

  it('deve retornar zero quando ocorrer falha ao buscar destinatários', async () => {
    notificationRecipientRepository.findUserIdsByPermission.mockRejectedValue(
      new Error('Falha ao consultar permissões'),
    );

    const result = await useCase.execute(input);

    expect(result).toEqual({ recipients: 0 });
    expect(createNotificationUseCase.execute).not.toHaveBeenCalled();
  });
});
