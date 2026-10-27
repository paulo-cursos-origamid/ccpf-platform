import { Module } from '@nestjs/common';
import { PayRecurringBillUseCase } from './application/pay-recurring-bill.use-case';

import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { TenantModule } from '../tenant/tenant.module';
import { BillingModule } from '../billing/billing.module';

import { CreateRecurringBillUseCase } from './application/create-recurring-bill.use-case';
import { ListRecurringBillsUseCase } from './application/list-recurring-bills.use-case';
import { GenerateRecurringBillOccurrencesUseCase } from './application/generate-recurring-bill-occurrences.use-case';
import { RecurringBillsController } from './presentation/recurring-bills.controller';

@Module({
  imports: [
    PrismaModule,
    IdentityModule,
    TenantModule,
    BillingModule,
  ],
  controllers: [RecurringBillsController],
  providers: [
    CreateRecurringBillUseCase,
    ListRecurringBillsUseCase,
    GenerateRecurringBillOccurrencesUseCase,
    PayRecurringBillUseCase,
  ],
})
export class RecurringBillsModule {}
