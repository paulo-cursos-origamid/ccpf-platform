import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
  ServiceUnavailableException,
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

import { SubscriptionEntity } from '../../../../billing/domain/entities/subscription.entity';
import { SubscriptionStatus } from '../../../../billing/domain/enums/subscription-status.enum';
import { BillingInterval } from '../../../../billing/domain/enums/billing-interval.enum';

export interface CreatePublicUserInput {
  name: string;
  email: string;
  password: string;
}

export interface CreatePublicUserOutput {
  id: string;
  name: string;
  email: string;
}

/**
 * Caso de uso responsável pelo cadastro público de um novo cliente SaaS.
 *
 * Diferentemente do CreateUserUseCase, este caso de uso provisiona
 * todo o contexto inicial do cliente:
 *
 * - User;
 * - Tenant;
 * - TenantMember com papel OWNER;
 * - Subscription TRIALING vinculada ao plano TRIAL.
 *
 * A persistência das quatro estruturas ocorre em uma única transação
 * através do PublicUserProvisioningRepository.
 */
@Injectable()
export class CreatePublicUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,

    @Inject(PasswordHasherContract)
    private readonly passwordHasher: PasswordHasherContract,

    @Inject(EmailVerificationNotifierContract)
    private readonly emailVerificationNotifier: EmailVerificationNotifierContract,

    private readonly publicUserProvisioningRepository: PublicUserProvisioningRepository,
  ) {}

  async execute(input: CreatePublicUserInput): Promise<CreatePublicUserOutput> {
    const name = input.name.trim();
    const email = input.email.trim().toLowerCase();

    if (!name) {
      throw new BadRequestException('Nome é obrigatório.');
    }

    if (!email) {
      throw new BadRequestException('E-mail é obrigatório.');
    }

    const existingUser = await this.userRepository.findByEmail(email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const trialPlan =
      await this.publicUserProvisioningRepository.findPublicTrialPlan();

    if (!trialPlan) {
      throw new ServiceUnavailableException(
        'O cadastro público está indisponível no momento.',
      );
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    const verificationToken = randomUUID();

    const verificationTokenExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24,
    );

    const now = new Date();

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
    );

    const owner = new TenantMemberEntity({
      tenantId: tenant.id,
      userId: user.id,
      role: TenantRole.OWNER,
      status: TenantMemberStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
    });

    const currentPeriodStart = now;
    const currentPeriodEnd = this.calculatePeriodEnd(
      currentPeriodStart,
      trialPlan.billingInterval,
    );

    const trialEndsAt = this.calculateTrialEnd(currentPeriodStart);

    const subscription = new SubscriptionEntity(
      randomUUID(),
      tenant.id,
      trialPlan.id,
      SubscriptionStatus.TRIALING,
      now,
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt,
      null,
      now,
      now,
    );

    let result: {
      user: UserEntity;
      tenant: TenantEntity;
      owner: TenantMemberEntity;
      subscription: SubscriptionEntity;
    };

    try {
      result = await this.publicUserProvisioningRepository.create(
        user,
        tenant,
        owner,
        subscription,
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

  /**
   * Gera um slug determinístico e único para o Tenant recém-criado.
   *
   * O UUID parcial evita colisões entre usuários com o mesmo nome.
   */
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

  /**
   * Calcula o final do período comercial.
   *
   * O plano TRIAL atualmente utiliza intervalo mensal.
   * A regra permanece baseada no BillingInterval para manter
   * o comportamento consistente com o Billing.
   */
  private calculatePeriodEnd(
    start: Date,
    billingInterval: BillingInterval,
  ): Date {
    const end = new Date(start);

    if (billingInterval === BillingInterval.YEARLY) {
      end.setFullYear(end.getFullYear() + 1);
      return end;
    }

    end.setMonth(end.getMonth() + 1);

    return end;
  }

  /**
   * Calcula o encerramento dos 14 dias de avaliação gratuita.
   */
  private calculateTrialEnd(start: Date): Date {
    const trialEnd = new Date(start);

    trialEnd.setDate(trialEnd.getDate() + 14);

    return trialEnd;
  }
}
