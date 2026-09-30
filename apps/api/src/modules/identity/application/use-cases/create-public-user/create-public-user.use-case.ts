import {
  BadRequestException,
  ConflictException,
  Injectable,
  Inject,
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
import { BillingInterval } from '../../../../billing/domain/enums/billing-interval.enum';

export interface CreatePublicUserInput {
  name: string;
  email: string;
  password: string;
  planCode: string;
}

export interface CreatePublicUserOutput {
  id: string;
  name: string;
  email: string;
}

/**
 * Caso de uso responsável pelo cadastro público de um novo cliente SaaS.
 *
 * O cadastro público provisiona, de forma atômica:
 *
 * - User;
 * - Tenant;
 * - TenantMember com papel OWNER;
 * - Subscription inicial;
 * - Invoice inicial para planos pagos.
 *
 * A escolha do plano é uma intenção enviada pelo cliente.
 * A autoridade sobre o plano continua sendo o backend, que
 * consulta o catálogo público de planos antes do provisionamento.
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

    const isTrial = plan.code === 'TRIAL';

    const currentPeriodStart = now;
    const currentPeriodEnd = this.calculatePeriodEnd(
      currentPeriodStart,
      plan.billingInterval,
    );

    const trialEndsAt = isTrial
      ? this.calculateTrialEnd(currentPeriodStart)
      : null;

    const subscriptionStatus = isTrial
      ? SubscriptionStatus.TRIALING
      : SubscriptionStatus.PENDING;

    const subscription = new SubscriptionEntity(
      randomUUID(),
      tenant.id,
      plan.id,
      subscriptionStatus,
      now,
      currentPeriodStart,
      currentPeriodEnd,
      trialEndsAt,
      null,
      now,
      now,
    );

    /**
     * Planos pagos criam imediatamente uma obrigação financeira.
     *
     * A Invoice é construída aqui, mas sua persistência acontece
     * dentro da mesma transação do User, Tenant, OWNER e Subscription.
     */
    const invoice = isTrial
      ? null
      : this.createInitialInvoice(subscription, plan.price, plan.currency, now);

    let result: {
      user: UserEntity;
      tenant: TenantEntity;
      owner: TenantMemberEntity;
      subscription: SubscriptionEntity;
      invoice: InvoiceEntity | null;
    };

    try {
      result = await this.publicUserProvisioningRepository.create(
        user,
        tenant,
        owner,
        subscription,
        invoice,
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
   * Cria a Invoice inicial de uma contratação paga.
   *
   * A Invoice começa como PENDING porque o pagamento ainda
   * não foi confirmado.
   */
  private createInitialInvoice(
    subscription: SubscriptionEntity,
    amount: number,
    currency: string,
    referenceDate: Date,
  ): InvoiceEntity {
    if (amount <= 0) {
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
      amount,
      currency,
      dueAt,
      null,
      referenceDate,
      referenceDate,
    );
  }

  /**
   * Define o vencimento padrão da primeira Invoice.
   *
   * A regra segue o comportamento existente do Billing:
   * sete dias após a criação.
   */
  private calculateInvoiceDueAt(referenceDate: Date): Date {
    const dueAt = new Date(referenceDate);

    dueAt.setDate(dueAt.getDate() + 7);

    return dueAt;
  }

  /**
   * Gera o identificador público da Invoice.
   */
  private generateInvoiceNumber(referenceDate: Date): string {
    const year = referenceDate.getFullYear();
    const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
    const suffix = randomUUID().replaceAll('-', '').slice(0, 8).toUpperCase();

    return `CCPF-${year}-${month}-${suffix}`;
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
   * Calcula o final do período comercial conforme
   * o intervalo de cobrança definido pelo plano.
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
