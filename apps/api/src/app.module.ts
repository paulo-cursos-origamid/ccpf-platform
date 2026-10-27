import { Module } from '@nestjs/common';
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

@Module({
  imports: [
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
