import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';

import { PrismaModule } from './infrastructure/database/prisma.module';

import { IdentityModule } from './modules/identity/identity.module';
import { ProfileModule } from './modules/profile/profile.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { RecurringBillsModule } from './modules/recurring-bills/recurring-bills.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { BillingModule } from './modules/billing/billing.module';
import { PlatformAdminModule } from './modules/platform-admin/platform-admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FinancialGoalsModule } from './modules/financial-goals/financial-goals.module';
import { AccountsPayableReceivableModule } from './modules/accounts-payable-receivable/accounts-payable-receivable.module';
import { CreditCardsModule } from './modules/credit-cards/credit-cards.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    IdentityModule,
    ProfileModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    RecurringBillsModule,
    TenantModule,
    BillingModule,
    PlatformAdminModule,
    NotificationsModule,
    FinancialGoalsModule,
    AccountsPayableReceivableModule,
    CreditCardsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
