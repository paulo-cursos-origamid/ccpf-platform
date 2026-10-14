import { Module } from '@nestjs/common';

import { IdentityModule } from '../identity/identity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TenantModule } from '../tenant/tenant.module';

import { SubscriptionLifecycleService } from './application/services/subscription-lifecycle.service';
import { SubscriptionLifecycleApplicationService } from './application/services/subscription-lifecycle-application.service';
import { InvoiceCreationService } from './application/services/invoice-creation.service';
import { ManualPaymentInstrumentService } from './application/services/manual-payment-instrument.service';
import { GetTenantInvoiceUseCase } from './application/use-cases/invoice/get-tenant-invoice.use-case';
import { GetAdminInvoiceUseCase } from './application/use-cases/admin/get-admin-invoice.use-case';
import { ListAdminInvoicesUseCase } from './application/use-cases/admin/list-admin-invoices.use-case';
import { ListTenantInvoicesUseCase } from './application/use-cases/invoice/list-tenant-invoices.use-case';
import { CreateInvoiceUseCase } from './application/use-cases/invoice/create-invoice.use-case';
import { ConfirmPaymentUseCase } from './application/use-cases/payment/confirm-payment.use-case';
import { CancelPaymentUseCase } from './application/use-cases/payment/cancel-payment.use-case';
import { CreatePaymentUseCase } from './application/use-cases/payment/create-payment.use-case';
import { ActivateSubscriptionUseCase } from './application/use-cases/activate-subscription.use-case';
import { CancelSubscriptionUseCase } from './application/use-cases/cancel-subscription.use-case';
import { ChangeSubscriptionPlanUseCase } from './application/use-cases/change-subscription-plan/change-subscription-plan.use-case';
import { CreateSubscriptionUseCase } from './application/use-cases/create-subscription.use-case';
import { GetTenantSubscriptionUseCase } from './application/use-cases/get-tenant-subscription.use-case';
import { ListPublicPlansUseCase } from './application/use-cases/list-public-plans.use-case';
import { AssignSystemOwnerPlanUseCase } from './application/use-cases/assign-system-owner-plan.use-case';

import { BillingController } from './presentation/controllers/billing.controller';
import { SubscriptionAccessGuard } from './presentation/guards/subscription-access.guard';

import { PlanRepository } from './domain/repositories/plan.repository';
import { PlanPriceRepository } from './domain/repositories/plan-price.repository';
import { BillingUnitOfWork } from './domain/repositories/billing-unit-of-work';
import { InvoiceRepository } from './domain/repositories/invoice.repository';
import { InvoiceInstallmentRepository } from './domain/repositories/invoice-installment.repository';
import { PaymentRepository } from './domain/repositories/payment.repository';
import { SubscriptionRepository } from './domain/repositories/subscription.repository';
import { BillingDateService } from './domain/services/billing-date.service';

import { PrismaPlanRepository } from './infrastructure/persistence/prisma-plan.repository';
import { PrismaPlanPriceRepository } from './infrastructure/persistence/prisma-plan-price.repository';
import { PrismaBillingUnitOfWork } from './infrastructure/persistence/prisma-billing-unit-of-work';
import { PrismaInvoiceRepository } from './infrastructure/persistence/prisma-invoice.repository';
import { PrismaInvoiceInstallmentRepository } from './infrastructure/persistence/prisma-invoice-installment.repository';
import { PrismaPaymentRepository } from './infrastructure/persistence/prisma-payment.repository';
import { PrismaSubscriptionRepository } from './infrastructure/persistence/prisma-subscription.repository';

/**
 * Módulo responsável pelo domínio de Billing.
 *
 * Responsabilidades:
 * - disponibilizar os casos de uso de Billing;
 * - disponibilizar os contratos de persistência;
 * - registrar as implementações Prisma dos repositórios;
 * - consumir recursos dos módulos Tenant e Identity quando necessário.
 */
@Module({
  imports: [TenantModule, IdentityModule, NotificationsModule],

  controllers: [BillingController],

  providers: [
    ListPublicPlansUseCase,
    AssignSystemOwnerPlanUseCase,
    GetTenantSubscriptionUseCase,
    CreateSubscriptionUseCase,
    ChangeSubscriptionPlanUseCase,
    CancelSubscriptionUseCase,
    ActivateSubscriptionUseCase,
    CreateInvoiceUseCase,
    ListTenantInvoicesUseCase,
    GetTenantInvoiceUseCase,
    ListAdminInvoicesUseCase,
    GetAdminInvoiceUseCase,
    CreatePaymentUseCase,
    ConfirmPaymentUseCase,
    CancelPaymentUseCase,
    SubscriptionLifecycleService,
    SubscriptionLifecycleApplicationService,
    InvoiceCreationService,
    BillingDateService,
    ManualPaymentInstrumentService,
    SubscriptionAccessGuard,

    {
      provide: PlanRepository,
      useClass: PrismaPlanRepository,
    },

    {
      provide: PlanPriceRepository,
      useClass: PrismaPlanPriceRepository,
    },

    {
      provide: InvoiceRepository,
      useClass: PrismaInvoiceRepository,
    },

    {
      provide: InvoiceInstallmentRepository,
      useClass: PrismaInvoiceInstallmentRepository,
    },

    {
      provide: BillingUnitOfWork,
      useClass: PrismaBillingUnitOfWork,
    },

    {
      provide: PaymentRepository,
      useClass: PrismaPaymentRepository,
    },

    {
      provide: SubscriptionRepository,
      useClass: PrismaSubscriptionRepository,
    },
  ],

  exports: [
    PlanRepository,
    PlanPriceRepository,
    InvoiceRepository,
    InvoiceInstallmentRepository,
    PaymentRepository,
    BillingUnitOfWork,
    SubscriptionRepository,
    ListPublicPlansUseCase,
    GetTenantSubscriptionUseCase,
    CreateSubscriptionUseCase,
    ChangeSubscriptionPlanUseCase,
    CancelSubscriptionUseCase,
    ActivateSubscriptionUseCase,
    CreateInvoiceUseCase,
    ListTenantInvoicesUseCase,
    GetTenantInvoiceUseCase,
    ListAdminInvoicesUseCase,
    GetAdminInvoiceUseCase,
    CreatePaymentUseCase,
    ConfirmPaymentUseCase,
    SubscriptionLifecycleService,
    SubscriptionLifecycleApplicationService,
    SubscriptionAccessGuard,
  ],
})
export class BillingModule {}
