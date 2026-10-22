import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { InvoiceEntity } from '../../../domain/entities/invoice.entity';
import { PlanEntity } from '../../../domain/entities/plan.entity';
import { PlanPriceEntity } from '../../../domain/entities/plan-price.entity';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';
import { SubscriptionEntity } from '../../../domain/entities/subscription.entity';
import { BillingInterval } from '../../../domain/enums/billing-interval.enum';
import { SubscriptionStatus } from '../../../domain/enums/subscription-status.enum';
import { TenantRole } from '../../../../tenant/domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { BillingUnitOfWork } from '../../../domain/repositories/billing-unit-of-work';
import { InvoiceCreationService } from '../../services/invoice-creation.service';
import { SubscriptionLifecycleApplicationService } from '../../services/subscription-lifecycle-application.service';
import { BillingDateService } from '../../../domain/services/billing-date.service';
import { CreateNotificationsForPermissionUseCase } from '../../../../notifications/application/use-cases/create-notifications-for-permission.use-case';
import { ChangeSubscriptionPlanUseCase } from './change-subscription-plan.use-case';

describe('ChangeSubscriptionPlanUseCase', () => {
  const tenantId = 'tenant-1';
  const userId = 'user-1';

  const dates = {
    startedAt: new Date('2026-01-01T00:00:00.000Z'),
    start: new Date('2026-10-01T00:00:00.000Z'),
    end: new Date('2027-04-01T00:00:00.000Z'),
    now: new Date('2026-12-01T00:00:00.000Z'),
  };

  const createPlan = (id: string, code: string, maxUsers: number): PlanEntity =>
    new PlanEntity(
      id,
      code,
      code,
      null,
      maxUsers,
      true,
      true,
      [],
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );

  const createPrice = (
    id: string,
    planId: string,
    interval: BillingInterval,
    amount: number,
    isActive = true,
  ): PlanPriceEntity =>
    new PlanPriceEntity(
      id,
      planId,
      interval,
      amount,
      'BRL',
      isActive,
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
    );

  const createSubscription = (
    overrides: Partial<{
      planId: string;
      planPriceId: string | null;
      status: SubscriptionStatus;
      billingDay: number | null;
      nextBillingDate: Date | null;
      currentPeriodStart: Date;
      currentPeriodEnd: Date;
      trialEndsAt: Date | null;
    }> = {},
  ): SubscriptionEntity =>
    new SubscriptionEntity(
      'subscription-1',
      tenantId,
      overrides.planId ?? 'plan-basic',
      overrides.planPriceId ?? 'price-basic-semesterly',
      overrides.status ?? SubscriptionStatus.ACTIVE,
      dates.startedAt,
      overrides.currentPeriodStart ?? dates.start,
      overrides.currentPeriodEnd ?? dates.end,
      overrides.billingDay ?? 1,
      overrides.nextBillingDate ?? new Date('2027-01-01T00:00:00.000Z'),
      overrides.trialEndsAt ?? null,
      null,
      dates.startedAt,
      dates.now,
    );

  const createSut = ({
    subscription,
    currentPlan,
    targetPlan,
    currentPrice,
    targetPrice,
    tenantRole = TenantRole.OWNER,
    memberCount = 1,
    lifecycleSubscription,
    invoice = new InvoiceEntity(
      'invoice-1',
      tenantId,
      'subscription-1',
      'INV-TEST-001',
      InvoiceStatus.PENDING,
      100,
      'BRL',
      dates.end,
      null,
      dates.startedAt,
      dates.now,
      1,
    ),
  }: {
    subscription?: SubscriptionEntity | null;
    currentPlan?: PlanEntity | null;
    targetPlan?: PlanEntity | null;
    currentPrice?: PlanPriceEntity | null;
    targetPrice?: PlanPriceEntity | null;
    tenantRole?: TenantRole | null;
    memberCount?: number;
    lifecycleSubscription?: SubscriptionEntity | null;
    invoice?: InvoiceEntity;
  } = {}) => {
    const resolvedCurrentPlan =
      currentPlan === undefined
        ? createPlan('plan-basic', 'BASIC', 3)
        : currentPlan;

    const resolvedTargetPlan =
      targetPlan === undefined ? createPlan('plan-pro', 'PRO', 5) : targetPlan;

    const resolvedCurrentPrice =
      currentPrice === undefined
        ? createPrice(
            'price-basic-semesterly',
            resolvedCurrentPlan?.id ?? 'plan-basic',
            BillingInterval.SEMESTERLY,
            600,
          )
        : currentPrice;

    const resolvedTargetPrice =
      targetPrice === undefined
        ? createPrice(
            'price-pro-yearly',
            resolvedTargetPlan?.id ?? 'plan-pro',
            BillingInterval.YEARLY,
            1800,
          )
        : targetPrice;

    const resolvedSubscription =
      subscription === undefined
        ? createSubscription({
            planId: resolvedCurrentPlan?.id ?? 'plan-basic',
            planPriceId: resolvedCurrentPrice?.id ?? null,
          })
        : subscription;

    const resolvedLifecycleSubscription =
      lifecycleSubscription === undefined
        ? resolvedSubscription
        : lifecycleSubscription;

    const tenantMemberRepository = {
      findByTenantAndUser: jest.fn().mockResolvedValue(
        tenantRole
          ? {
              id: 'member-1',
              tenantId,
              userId,
              role: tenantRole,
            }
          : null,
      ),
      countByTenant: jest.fn().mockResolvedValue(memberCount),
    } as unknown as TenantMemberRepository;

    const subscriptionRepository = {
      findCurrentByTenant: jest.fn().mockResolvedValue(resolvedSubscription),
      update: jest
        .fn()
        .mockImplementation((entity: SubscriptionEntity) =>
          Promise.resolve(entity),
        ),
    create: jest.fn(),
    findById: jest.fn(),
    findByTenant: jest.fn(),
    };

    const planRepository = {
      findById: jest.fn().mockResolvedValue(resolvedCurrentPlan),
      findByCode: jest.fn().mockResolvedValue(resolvedTargetPlan),
    create: jest.fn(),
    findPublicPlans: jest.fn(),
    update: jest.fn(),
    };

    const planPriceRepository = {
      findById: jest.fn().mockImplementation((id: string) => {
        if (id === resolvedTargetPrice?.id) {
          return resolvedTargetPrice;
        }

        if (id === resolvedCurrentPrice?.id) {
          return resolvedCurrentPrice;
        }

        return null;
      }),
    create: jest.fn(),
    findByPlanAndInterval: jest.fn(),
    findActiveByPlan: jest.fn(),
    update: jest.fn(),
    };

    const invoiceRepository = {
      findOpenBySubscription: jest.fn().mockResolvedValue(null),
      create: jest.fn(),
      findById: jest.fn(),
      findByNumber: jest.fn(),
      findByTenant: jest.fn(),
      findBySubscription: jest.fn(),
      update: jest.fn(),
      findManyForAdmin: jest.fn(),
      findAdminById: jest.fn(),
    };

    const paymentRepository = {
    create: jest.fn(),
    findById: jest.fn(),
    findByReference: jest.fn(),
    findByInstallment: jest.fn(),
    update: jest.fn(),
  };

    const billingContext = {
      invoiceRepository,
      invoiceInstallmentRepository: {
        create: jest.fn(),
        createMany: jest.fn(),
        findById: jest.fn(),
        findByInvoice: jest.fn(),
        update: jest.fn(),
      },
      paymentRepository,
      subscriptionRepository,
      planRepository,
      planPriceRepository,
      lockInvoice: jest.fn(),
      lockSubscription: jest.fn(),
    };

    const billingUnitOfWork = {
      execute: jest
        .fn()
        .mockImplementation(
          async (work: Parameters<BillingUnitOfWork['execute']>[0]) =>
            work(billingContext),
        ),
    } as unknown as BillingUnitOfWork;

    const subscriptionLifecycleApplicationService = {
      synchronize: jest.fn().mockResolvedValue(resolvedLifecycleSubscription),
    } as unknown as SubscriptionLifecycleApplicationService;

    const invoiceCreationService = {
      execute: jest.fn().mockResolvedValue(invoice),
    } as unknown as InvoiceCreationService;

    const billingDateService = {
      validateBillingDayForInterval: jest
        .fn()
        .mockImplementation(
          (billingDay: number | undefined, interval: BillingInterval) => {
            if (interval === BillingInterval.LIFETIME) {
              return null;
            }

            return billingDay ?? 1;
          },
        ),
      calculateNextBillingDate: jest
        .fn()
        .mockReturnValue(new Date('2027-01-01T00:00:00.000Z')),
      calculatePeriodEnd: jest
        .fn()
        .mockReturnValue(new Date('2027-12-01T00:00:00.000Z')),
    } as unknown as BillingDateService;

    const createNotificationsForPermissionUseCase = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as CreateNotificationsForPermissionUseCase;

    const sut = new ChangeSubscriptionPlanUseCase(
      tenantMemberRepository,
      billingUnitOfWork,
      subscriptionLifecycleApplicationService,
      invoiceCreationService,
      billingDateService,
      createNotificationsForPermissionUseCase,
    );

    return {
      sut,
      tenantMemberRepository,
      subscriptionRepository,
      planRepository,
      planPriceRepository,
      billingUnitOfWork,
      billingContext,
      subscriptionLifecycleApplicationService,
      invoiceCreationService,
      billingDateService,
      createNotificationsForPermissionUseCase,
      subscription: resolvedSubscription,
      currentPlan: resolvedCurrentPlan,
      targetPlan: resolvedTargetPlan,
      currentPrice: resolvedCurrentPrice,
      targetPrice: resolvedTargetPrice,
    };
  };

  const executeInput = (
    overrides: Partial<{
      planCode: string;
      planPriceId: string;
      billingDay: number;
    }> = {},
  ) => ({
    tenantId,
    userId,
    planCode: overrides.planCode ?? 'PRO',
    planPriceId: overrides.planPriceId ?? 'price-pro-yearly',
    billingDay: overrides.billingDay ?? 1,
  });

  it('deve rejeitar alteração quando o usuário não é OWNER', async () => {
    const { sut, billingUnitOfWork } = createSut({
      tenantRole: TenantRole.ADMIN,
    });

    await expect(sut.execute(executeInput())).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    // O método é um mock criado sobre a interface do Unit of Work.
    // O ESLint não consegue preservar a tipagem Jest após o cast da interface.
    expect(billingUnitOfWork.execute).not.toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
  });

  it('deve rejeitar alteração quando não existe assinatura atual', async () => {
    const { sut, subscriptionRepository } = createSut({
      subscription: null,
      lifecycleSubscription: null,
    });

    await expect(sut.execute(executeInput())).rejects.toBeInstanceOf(
      NotFoundException,
    );

    expect(subscriptionRepository.findCurrentByTenant).toHaveBeenCalledWith(
      tenantId,
    );
  });

  it('deve rejeitar alteração para o mesmo plano e mesma modalidade', async () => {
    const plan = createPlan('plan-basic', 'BASIC', 3);
    const price = createPrice(
      'price-basic-semesterly',
      plan.id,
      BillingInterval.SEMESTERLY,
      600,
    );

    const { sut } = createSut({
      currentPlan: plan,
      targetPlan: plan,
      currentPrice: price,
      targetPrice: price,
      subscription: createSubscription({
        planId: plan.id,
        planPriceId: price.id,
      }),
    });

    await expect(
      sut.execute({
        ...executeInput({
          planCode: 'BASIC',
          planPriceId: price.id,
        }),
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deve rejeitar plano de destino inexistente', async () => {
    const { sut } = createSut({
      targetPlan: null,
    });

    await expect(sut.execute(executeInput())).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('deve rejeitar plano TRIAL como destino', async () => {
    const trialPlan = createPlan('plan-trial', 'TRIAL', 2);
    const trialPrice = createPrice(
      'price-trial',
      trialPlan.id,
      BillingInterval.SEMESTERLY,
      100,
    );

    const { sut } = createSut({
      targetPlan: trialPlan,
      targetPrice: trialPrice,
    });

    await expect(
      sut.execute({
        ...executeInput({
          planCode: 'TRIAL',
          planPriceId: trialPrice.id,
        }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve rejeitar modalidade que não pertence ao plano de destino', async () => {
    const targetPlan = createPlan('plan-pro', 'PRO', 5);
    const wrongPrice = createPrice(
      'price-wrong-plan',
      'plan-basic',
      BillingInterval.SEMESTERLY,
      600,
    );

    const { sut } = createSut({
      targetPlan,
      targetPrice: wrongPrice,
    });

    await expect(
      sut.execute(
        executeInput({
          planPriceId: wrongPrice.id,
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve rejeitar modalidade comercial inativa', async () => {
    const targetPlan = createPlan('plan-pro', 'PRO', 5);
    const inactivePrice = createPrice(
      'price-pro-yearly',
      targetPlan.id,
      BillingInterval.YEARLY,
      1800,
      false,
    );

    const { sut } = createSut({
      targetPlan,
      targetPrice: inactivePrice,
    });

    await expect(sut.execute(executeInput())).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('deve converter TRIALING para plano pago, gerar Invoice integral e deixar a assinatura PENDING', async () => {
    const trialPlan = createPlan('plan-trial', 'TRIAL', 2);
    const targetPlan = createPlan('plan-pro', 'PRO', 5);
    const targetPrice = createPrice(
      'price-pro-yearly',
      targetPlan.id,
      BillingInterval.YEARLY,
      1800,
    );

    const trialSubscription = createSubscription({
      planId: trialPlan.id,
      planPriceId: null,
      status: SubscriptionStatus.TRIALING,
      nextBillingDate: null,
      trialEndsAt: new Date('2026-12-31T00:00:00.000Z'),
    });

    const {
      sut,
      invoiceCreationService,
      subscriptionRepository,
      createNotificationsForPermissionUseCase,
    } = createSut({
      subscription: trialSubscription,
      currentPlan: trialPlan,
      targetPlan,
      currentPrice: null,
      targetPrice,
      lifecycleSubscription: trialSubscription,
      memberCount: 1,
    });

    const result = await sut.execute(executeInput());

    expect(result.status).toBe(SubscriptionStatus.PENDING);
    expect(result.planId).toBe(targetPlan.id);
    expect(result.planPriceId).toBe(targetPrice.id);

    const invoiceExecute = jest.spyOn(invoiceCreationService, 'execute');
    expect(invoiceExecute).toHaveBeenCalledWith(
      {
        subscriptionId: trialSubscription.id,
        installmentCount: 1,
      },
      expect.objectContaining({
        invoiceRepository: expect.anything(), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        planRepository: expect.anything(), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        planPriceRepository: expect.anything(), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
        subscriptionRepository: expect.anything(), // eslint-disable-line @typescript-eslint/no-unsafe-assignment
      }),
    );

    expect(subscriptionRepository.update).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(createNotificationsForPermissionUseCase.execute).toHaveBeenCalled();
  });

  it('deve tratar aumento de capacidade como upgrade, gerar Invoice e agendar a alteração', async () => {
    const {
      sut,
      invoiceCreationService,
      subscriptionRepository,
      createNotificationsForPermissionUseCase,
    } = createSut();

    const result = await sut.execute(executeInput());

    expect(invoiceCreationService.execute).toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method

    expect(result.pendingPlanId).toBe('plan-pro');
    expect(result.pendingPlanPriceId).toBe('price-pro-yearly');
    expect(result.pendingPlanInvoiceId).toBe('invoice-1');

    expect(subscriptionRepository.update).toHaveBeenCalled();
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(createNotificationsForPermissionUseCase.execute).toHaveBeenCalled();
  });

  it('deve tratar redução de capacidade como downgrade e agendar para o fim do ciclo sem Invoice', async () => {
    const currentPlan = createPlan('plan-pro', 'PRO', 5);
    const targetPlan = createPlan('plan-basic', 'BASIC', 3);

    const currentPrice = createPrice(
      'price-pro-yearly',
      currentPlan.id,
      BillingInterval.YEARLY,
      1800,
    );

    const targetPrice = createPrice(
      'price-basic-semesterly',
      targetPlan.id,
      BillingInterval.SEMESTERLY,
      600,
    );

    const subscription = createSubscription({
      planId: currentPlan.id,
      planPriceId: currentPrice.id,
    });

    const { sut, invoiceCreationService, subscriptionRepository } = createSut({
      currentPlan,
      targetPlan,
      currentPrice,
      targetPrice,
      subscription,
      memberCount: 2,
    });

    const result = await sut.execute({
      ...executeInput({
        planCode: 'BASIC',
        planPriceId: targetPrice.id,
      }),
    });

    expect(result.pendingPlanId).toBe(targetPlan.id);
    expect(result.pendingPlanPriceId).toBe(targetPrice.id);
    expect(result.pendingPlanInvoiceId).toBeNull();
    expect(result.pendingPlanEffectiveAt).toEqual(dates.end);

    expect(invoiceCreationService.execute).not.toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
    expect(subscriptionRepository.update).toHaveBeenCalled();
  });

  it('deve tratar SEMESTERLY para YEARLY no mesmo plano como upgrade comercial', async () => {
    const plan = createPlan('plan-basic', 'BASIC', 3);

    const currentPrice = createPrice(
      'price-basic-semesterly',
      plan.id,
      BillingInterval.SEMESTERLY,
      600,
    );

    const targetPrice = createPrice(
      'price-basic-yearly',
      plan.id,
      BillingInterval.YEARLY,
      1800,
    );

    const subscription = createSubscription({
      planId: plan.id,
      planPriceId: currentPrice.id,
    });

    const { sut, invoiceCreationService } = createSut({
      currentPlan: plan,
      targetPlan: plan,
      currentPrice,
      targetPrice,
      subscription,
    });

    const result = await sut.execute({
      ...executeInput({
        planCode: 'BASIC',
        planPriceId: targetPrice.id,
      }),
    });

    expect(result.pendingPlanId).toBe(plan.id);
    expect(result.pendingPlanPriceId).toBe(targetPrice.id);
    expect(result.pendingPlanInvoiceId).toBe('invoice-1');
    expect(invoiceCreationService.execute).toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
  });

  it('deve tratar YEARLY para SEMESTERLY no mesmo plano como downgrade comercial', async () => {
    const plan = createPlan('plan-basic', 'BASIC', 3);

    const currentPrice = createPrice(
      'price-basic-yearly',
      plan.id,
      BillingInterval.YEARLY,
      1200,
    );

    const targetPrice = createPrice(
      'price-basic-semesterly',
      plan.id,
      BillingInterval.SEMESTERLY,
      600,
    );

    const subscription = createSubscription({
      planId: plan.id,
      planPriceId: currentPrice.id,
    });

    const { sut, invoiceCreationService } = createSut({
      currentPlan: plan,
      targetPlan: plan,
      currentPrice,
      targetPrice,
      subscription,
    });

    const result = await sut.execute({
      ...executeInput({
        planCode: 'BASIC',
        planPriceId: targetPrice.id,
      }),
    });

    expect(result.pendingPlanId).toBe(plan.id);
    expect(result.pendingPlanPriceId).toBe(targetPrice.id);
    expect(result.pendingPlanInvoiceId).toBeNull();
    expect(invoiceCreationService.execute).not.toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
  });

  it('deve tratar YEARLY para LIFETIME como upgrade e gerar cobrança proporcional', async () => {
    const plan = createPlan('plan-basic', 'BASIC', 3);

    const currentPrice = createPrice(
      'price-basic-yearly',
      plan.id,
      BillingInterval.YEARLY,
      1200,
    );

    const targetPrice = createPrice(
      'price-basic-lifetime',
      plan.id,
      BillingInterval.LIFETIME,
      2400,
    );

    const subscription = createSubscription({
      planId: plan.id,
      planPriceId: currentPrice.id,
    });

    const { sut, invoiceCreationService } = createSut({
      currentPlan: plan,
      targetPlan: plan,
      currentPrice,
      targetPrice,
      subscription,
    });

    const result = await sut.execute({
      ...executeInput({
        planCode: 'BASIC',
        planPriceId: targetPrice.id,
      }),
    });

    expect(result.pendingPlanId).toBe(plan.id);
    expect(result.pendingPlanPriceId).toBe(targetPrice.id);
    expect(result.pendingPlanInvoiceId).toBe('invoice-1');
    expect(invoiceCreationService.execute).toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
  });

  it('deve rejeitar conversão de LIFETIME para modalidade recorrente', async () => {
    const plan = createPlan('plan-basic', 'BASIC', 3);

    const currentPrice = createPrice(
      'price-basic-lifetime',
      plan.id,
      BillingInterval.LIFETIME,
      2400,
    );

    const targetPrice = createPrice(
      'price-basic-yearly',
      plan.id,
      BillingInterval.YEARLY,
      1200,
    );

    const subscription = createSubscription({
      planId: plan.id,
      planPriceId: currentPrice.id,
      billingDay: null,
      nextBillingDate: null,
    });

    const { sut } = createSut({
      currentPlan: plan,
      targetPlan: plan,
      currentPrice,
      targetPrice,
      subscription,
    });

    await expect(
      sut.execute({
        ...executeInput({
          planCode: 'BASIC',
          planPriceId: targetPrice.id,
        }),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deve rejeitar downgrade quando a capacidade atual de membros excede o limite do destino', async () => {
    const currentPlan = createPlan('plan-pro', 'PRO', 5);
    const targetPlan = createPlan('plan-basic', 'BASIC', 3);

    const currentPrice = createPrice(
      'price-pro-yearly',
      currentPlan.id,
      BillingInterval.YEARLY,
      1800,
    );

    const targetPrice = createPrice(
      'price-basic-semesterly',
      targetPlan.id,
      BillingInterval.SEMESTERLY,
      600,
    );

    const subscription = createSubscription({
      planId: currentPlan.id,
      planPriceId: currentPrice.id,
    });

    const { sut, subscriptionRepository } = createSut({
      currentPlan,
      targetPlan,
      currentPrice,
      targetPrice,
      subscription,
      memberCount: 4,
    });

    await expect(
      sut.execute({
        ...executeInput({
          planCode: 'BASIC',
          planPriceId: targetPrice.id,
        }),
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(subscriptionRepository.update).not.toHaveBeenCalled();
  });

  it('deve aceitar upgrade para plano ilimitado independentemente da quantidade de membros', async () => {
    const currentPlan = createPlan('plan-basic', 'BASIC', 3);
    const targetPlan = createPlan('plan-premium', 'PREMIUM', -1);

    const currentPrice = createPrice(
      'price-basic-yearly',
      currentPlan.id,
      BillingInterval.YEARLY,
      1200,
    );

    const targetPrice = createPrice(
      'price-premium-yearly',
      targetPlan.id,
      BillingInterval.YEARLY,
      2400,
    );

    const subscription = createSubscription({
      planId: currentPlan.id,
      planPriceId: currentPrice.id,
    });

    const { sut, tenantMemberRepository, invoiceCreationService } = createSut({
      currentPlan,
      targetPlan,
      currentPrice,
      targetPrice,
      subscription,
      memberCount: 999,
    });

    await sut.execute({
      ...executeInput({
        planCode: 'PREMIUM',
        planPriceId: targetPrice.id,
      }),
    });

    expect(tenantMemberRepository.countByTenant).not.toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
    expect(invoiceCreationService.execute).toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
  });

  it('deve aplicar imediatamente um upgrade comercial quando não existe saldo adicional', async () => {
    const plan = createPlan('plan-basic', 'BASIC', 3);

    const currentPrice = createPrice(
      'price-basic-semesterly',
      plan.id,
      BillingInterval.SEMESTERLY,
      1200,
    );

    const targetPrice = createPrice(
      'price-basic-yearly',
      plan.id,
      BillingInterval.YEARLY,
      1200,
    );

    const subscription = createSubscription({
      planId: plan.id,
      planPriceId: currentPrice.id,
    });

    const { sut, invoiceCreationService, subscriptionRepository } = createSut({
      currentPlan: plan,
      targetPlan: plan,
      currentPrice,
      targetPrice,
      subscription,
    });

    const result = await sut.execute({
      ...executeInput({
        planCode: 'BASIC',
        planPriceId: targetPrice.id,
      }),
    });

    expect(result.planId).toBe(plan.id);
    expect(result.planPriceId).toBe(targetPrice.id);
    expect(result.pendingPlanId).toBeNull();
    expect(result.pendingPlanInvoiceId).toBeNull();

    expect(invoiceCreationService.execute).not.toHaveBeenCalled(); // eslint-disable-line @typescript-eslint/unbound-method
    expect(subscriptionRepository.update).toHaveBeenCalled();
  });

  it('deve emitir a notificação somente depois da alteração financeira', async () => {
    const callOrder: string[] = [];

    const {
      sut,
      invoiceCreationService,
      subscriptionRepository,
      createNotificationsForPermissionUseCase,
    } = createSut();

    const invoiceExecute = jest.spyOn(invoiceCreationService, 'execute');
    invoiceExecute.mockImplementation(() => {
      callOrder.push('invoice');
      return Promise.resolve(new InvoiceEntity(
        'invoice-1', tenantId, 'subscription-1', 'INV-TEST-001',
        InvoiceStatus.PENDING, 100, 'BRL', dates.end, null,
        dates.startedAt, dates.now, 1,
      ));
    });

    // O repositório é tipado pela interface; o cast esconde o tipo Mock do ESLint.
    subscriptionRepository.update.mockImplementation(
      (entity: SubscriptionEntity) => {
        callOrder.push('subscription');
        return Promise.resolve(entity);
      },
    );

    // O caso de uso é tipado pela interface; o alias explicita o mock usado pelo teste.
    const notificationsExecute = jest.spyOn(
      createNotificationsForPermissionUseCase,
      'execute',
    );
    notificationsExecute.mockImplementation(() => {
      callOrder.push('notification');
      return Promise.resolve({ recipients: 0 });
    });

    await sut.execute(executeInput());

    expect(callOrder).toEqual(['invoice', 'subscription', 'notification']);
  });
});
