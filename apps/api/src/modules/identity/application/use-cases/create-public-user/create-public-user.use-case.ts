import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';

import { PasswordHasherContract } from '../../../domain/contracts/password-hasher.contract';
import { EmailVerificationNotifierContract } from '../../../domain/contracts/email-verification-notifier.contract';
import { UserEntity } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { PublicUserProvisioningRepository } from '../../../domain/repositories/public-user-provisioning.repository';

import { TenantEntity } from '../../../../tenant/domain/entities/tenant.entity';
import { TenantMemberEntity } from '../../../../tenant/domain/entities/tenant-member.entity';
import { TenantMemberStatus } from '../../../../tenant/domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../../tenant/domain/enums/tenant-role.enum';
import { TenantStatus } from '../../../../tenant/domain/enums/tenant-status.enum';

import { InvoiceEntity } from '../../../../billing/domain/entities/invoice.entity';
import { InvoiceStatus } from '../../../../billing/domain/enums/invoice-status.enum';
import { SubscriptionEntity } from '../../../../billing/domain/entities/subscription.entity';
import { SubscriptionStatus } from '../../../../billing/domain/enums/subscription-status.enum';
import { BillingDateService } from '../../../../billing/domain/services/billing-date.service';
import { InvoiceInstallmentScheduleService } from '../../../../billing/domain/services/invoice-installment-schedule.service';
import { InvoiceInstallmentEntity } from '../../../../billing/domain/entities/invoice-installment.entity';
import { PlanPriceEntity } from '../../../../billing/domain/entities/plan-price.entity';

import { CreateNotificationsForPermissionUseCase } from '../../../../notifications/application/use-cases/create-notifications-for-permission.use-case';
import { NotificationSeverity } from '../../../../notifications/domain/enums/notification-severity.enum';
import { NotificationType } from '../../../../notifications/domain/enums/notification-type.enum';

export interface CreatePublicUserInput {
  name: string;
  email: string;
  password: string;
  planCode: string;
  planPriceId?: string;
  billingDay?: number;
  installmentCount?: number;
}

export interface CreatePublicUserOutput {
  id: string;
  name: string;
  email: string;
}

@Injectable()
export class CreatePublicUserUseCase {
  private readonly logger = new Logger(CreatePublicUserUseCase.name);

  private readonly billingDateService = new BillingDateService();

  constructor(
    private readonly userRepository: UserRepository,

    @Inject(PasswordHasherContract)
    private readonly passwordHasher: PasswordHasherContract,

    @Inject(EmailVerificationNotifierContract)
    private readonly emailVerificationNotifier: EmailVerificationNotifierContract,

    private readonly publicUserProvisioningRepository: PublicUserProvisioningRepository,

    private readonly createNotificationsForPermissionUseCase: CreateNotificationsForPermissionUseCase,
  ) {}

  async execute(input: CreatePublicUserInput): Promise<CreatePublicUserOutput> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();
    const planCode = input.planCode.trim().toUpperCase();

    if (!name) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    if (!email) {
      throw new BadRequestException('E-mail é obrigatório.');
    }

    if (!planCode) {
      throw new BadRequestException('Plano é obrigatório.');
    }

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const plan =
      await this.publicUserProvisioningRepository.findPublicPlan(planCode);

    if (!plan) {
      throw new BadRequestException(
        'O plano selecionado não está disponível para contratação.',
      );
    }

    const isTrial = plan.code === 'TRIAL';

    let selectedPrice: PlanPriceEntity | null = null;

    if (!isTrial) {
      if (!input.planPriceId) {
        throw new BadRequestException(
          'A modalidade comercial é obrigatória para planos pagos.',
        );
      }

      const rawPrice = plan.prices.find(
        (price) => price.id === input.planPriceId,
      );

      if (!rawPrice) {
        throw new BadRequestException(
          'A modalidade comercial selecionada não pertence ao plano informado.',
        );
      }

      selectedPrice = new PlanPriceEntity(
        rawPrice.id,
        plan.id,
        rawPrice.interval,
        rawPrice.amount,
        rawPrice.currency,
        true,
        new Date(),
        new Date(),
      );
    }

    const now = new Date();

    const billingDay = selectedPrice
      ? this.billingDateService.validateBillingDayForInterval(
          input.billingDay,
          selectedPrice.interval,
        )
      : null;

    const currentPeriodStart = now;

    const currentPeriodEnd = isTrial
      ? this.calculateTrialEnd(currentPeriodStart)
      : (this.billingDateService.calculatePeriodEnd(
          currentPeriodStart,
          selectedPrice!.interval,
        ) ?? currentPeriodStart);

    const nextBillingDate = isTrial
      ? null
      : this.billingDateService.calculateNextBillingDate(
          currentPeriodStart,
          billingDay,
          selectedPrice!.interval,
        );

    const trialEndsAt = isTrial
      ? this.calculateTrialEnd(currentPeriodStart)
      : null;

    const subscriptionStatus = isTrial
      ? SubscriptionStatus.TRIALING
      : SubscriptionStatus.PENDING;

    const passwordHash = await this.passwordHasher.hash(input.password);

    const verificationToken = randomUUID();

    const verificationTokenExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24,
    );

    const user = new UserEntity({
      name,
      email,
      password: passwordHash,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
    });

    const tenantId = randomUUID();

    const tenant = new TenantEntity(
      tenantId,
      name,
      this.generateTenantSlug(name, tenantId),
      TenantStatus.ACTIVE,
      now,
      now,
      false,
    );

    const owner = new TenantMemberEntity({
      tenantId: tenant.id,
      userId: user.id,
      role: TenantRole.OWNER,
      status: TenantMemberStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    const subscription = new SubscriptionEntity(
      randomUUID(),
      tenant.id,
      plan.id,
      selectedPrice?.id ?? null,
      subscriptionStatus,
      now,
      currentPeriodStart,
      currentPeriodEnd,
      billingDay,
      nextBillingDate,
      trialEndsAt,
      null,
      now,
      now,
    );

    const invoice = isTrial
      ? null
      : this.createInitialInvoice(
          subscription,
          selectedPrice!,
          now,
          input.installmentCount ?? 1,
        );

    const installments = invoice
      ? InvoiceInstallmentScheduleService.create(invoice)
      : [];

    let result: {
      user: UserEntity;
      tenant: TenantEntity;
      owner: TenantMemberEntity;
      subscription: SubscriptionEntity;
      invoice: InvoiceEntity | null;
      installments: InvoiceInstallmentEntity[];
    };

    try {
      result = await this.publicUserProvisioningRepository.create(
        user,
        tenant,
        owner,
        subscription,
        invoice,
        installments,
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Email already registered');
      }

      throw error;
    }

    try {
      await this.createNotificationsForPermissionUseCase.execute({
        permissionCode: 'USERS_READ',
        type: NotificationType.ACCOUNT_CREATED,
        severity: NotificationSeverity.INFO,
        title: 'Nova conta criada',
        message: `A conta de ${result.user.name} (${result.user.email}) foi criada com sucesso.`,
        resourceType: 'TENANT',
        resourceId: result.tenant.id,
        deduplicationKey: `ACCOUNT_CREATED:${result.user.id}`,
      });
    } catch (error) {
      this.logger.error(
        `Não foi possível criar a notificação de nova conta para o usuário ${result.user.id}.`,
        error instanceof Error ? error.stack : undefined,
      );
    }

    await this.emailVerificationNotifier.sendVerificationEmail({
      email: result.user.email,
      name: result.user.name,
      verificationToken,
    });

    return {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
    };
  }

  private createInitialInvoice(
    subscription: SubscriptionEntity,
    planPrice: PlanPriceEntity,
    referenceDate: Date,
    installmentCount: number,
  ): InvoiceEntity {
    if (planPrice.amount <= 0) {
      throw new BadRequestException(
        'O valor do plano selecionado deve ser maior que zero.',
      );
    }

    const dueAt = this.calculateInvoiceDueAt(referenceDate);

    return new InvoiceEntity(
      randomUUID(),
      subscription.tenantId,
      subscription.id,
      this.generateInvoiceNumber(referenceDate),
      InvoiceStatus.PENDING,
      planPrice.amount,
      planPrice.currency,
      dueAt,
      null,
      referenceDate,
      referenceDate,
      installmentCount,
    );
  }

  private calculateInvoiceDueAt(referenceDate: Date): Date {
    const dueAt = new Date(referenceDate);

    dueAt.setDate(dueAt.getDate() + 7);

    return dueAt;
  }

  private generateInvoiceNumber(referenceDate: Date): string {
    const year = referenceDate.getFullYear();
    const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
    const suffix = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();

    return `CCPF-${year}-${month}-${suffix}`;
  }

  private generateTenantSlug(name: string, tenantId: string): string {
    const normalizedName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const base = normalizedName || 'tenant';

    return `${base}-${tenantId.slice(0, 8)}`;
  }

  private calculateTrialEnd(start: Date): Date {
    const trialEnd = new Date(start);

    trialEnd.setDate(trialEnd.getDate() + 14);

    return trialEnd;
  }
}
