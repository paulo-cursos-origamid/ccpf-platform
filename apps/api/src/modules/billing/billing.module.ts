import { Module } from '@nestjs/common';

import { TenantModule } from '../tenant/tenant.module';

import { SubscriptionLifecycleService } from './application/services/subscription-lifecycle.service';
import { CreateSubscriptionUseCase } from './application/use-cases/create-subscription.use-case';
import { BillingController } from './presentation/controllers/billing.controller';
import { SubscriptionAccessGuard } from './presentation/guards/subscription-access.guard';
import { GetTenantSubscriptionUseCase } from './application/use-cases/get-tenant-subscription.use-case';
import { ListPublicPlansUseCase } from './application/use-cases/list-public-plans.use-case';

import { PlanRepository } from './domain/repositories/plan.repository';
import { SubscriptionRepository } from './domain/repositories/subscription.repository';

import { PrismaPlanRepository } from './infrastructure/persistence/prisma-plan.repository';
import { PrismaSubscriptionRepository } from './infrastructure/persistence/prisma-subscription.repository';

/**
 * Módulo responsável pelo domínio de Billing.
 *
 * Responsabilidades:
 * - disponibilizar os casos de uso de Billing;
 * - disponibilizar os contratos de persistência de Plan e Subscription;
 * - registrar as implementações Prisma dos repositórios;
 * - consumir recursos do TenantModule quando necessário.
 */
@Module({
  imports: [TenantModule],

  controllers: [BillingController],

  providers: [
    ListPublicPlansUseCase,
    GetTenantSubscriptionUseCase,
    CreateSubscriptionUseCase,
    SubscriptionLifecycleService,
    SubscriptionAccessGuard,

    {
      provide: PlanRepository,
      useClass: PrismaPlanRepository,
    },

    {
      provide: SubscriptionRepository,
      useClass: PrismaSubscriptionRepository,
    },
  ],

  exports: [
    PlanRepository,
    SubscriptionRepository,
    ListPublicPlansUseCase,
    GetTenantSubscriptionUseCase,
    CreateSubscriptionUseCase,
    SubscriptionLifecycleService,
    SubscriptionAccessGuard,
  ],
})
export class BillingModule {}
