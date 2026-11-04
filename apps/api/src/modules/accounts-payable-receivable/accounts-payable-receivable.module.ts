import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AccountsModule } from '../accounts/accounts.module';
import { CategoriesModule } from '../categories/categories.module';
import { IdentityModule } from '../identity/identity.module';
import { TenantModule } from '../tenant/tenant.module';
import { BillingModule } from '../billing/billing.module';
import { AccountsPayableReceivableController } from './presentation/accounts-payable-receivable.controller';
import { FinancialObligationRepository } from './domain/repositories/financial-obligation.repository';
import { PrismaFinancialObligationRepository } from './infrastructure/persistence/prisma-financial-obligation.repository';
import { FinancialObligationsApplicationService } from './application/financial-obligations-application.service';
import { CancelFinancialObligationUseCase } from './application/use-cases/cancel-financial-obligation/cancel-financial-obligation.use-case';
import { CreateFinancialObligationUseCase } from './application/use-cases/create-financial-obligation/create-financial-obligation.use-case';
import { GetFinancialObligationUseCase } from './application/use-cases/get-financial-obligation/get-financial-obligation.use-case';
import { ListFinancialObligationsUseCase } from './application/use-cases/list-financial-obligations/list-financial-obligations.use-case';
import { SettleFinancialObligationUseCase } from './application/use-cases/settle-financial-obligation/settle-financial-obligation.use-case';
import { UpdateFinancialObligationUseCase } from './application/use-cases/update-financial-obligation/update-financial-obligation.use-case';

@Module({
  imports: [
    PrismaModule,
    AccountsModule,
    CategoriesModule,
    IdentityModule,
    TenantModule,
    BillingModule,
  ],
  controllers: [AccountsPayableReceivableController],
  providers: [
    FinancialObligationsApplicationService,
    CancelFinancialObligationUseCase,
    CreateFinancialObligationUseCase,
    GetFinancialObligationUseCase,
    ListFinancialObligationsUseCase,
    SettleFinancialObligationUseCase,
    UpdateFinancialObligationUseCase,
    {
      provide: FinancialObligationRepository,
      useClass: PrismaFinancialObligationRepository,
    },
  ],
})
export class AccountsPayableReceivableModule {}
