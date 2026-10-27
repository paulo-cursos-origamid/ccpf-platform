import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { IdentityModule } from '../identity/identity.module';
import { TenantModule } from '../tenant/tenant.module';
import { BillingModule } from '../billing/billing.module';
import { CreateTransactionUseCase } from './application/create-transaction.use-case';
import { CreateTransferUseCase } from './application/create-transfer.use-case';
import { ListTransfersUseCase } from './application/list-transfers.use-case';
import { ListTransactionsUseCase } from './application/list-transactions.use-case';
import { ListFinancialHistoryUseCase } from './application/list-financial-history.use-case';
import { GetTransactionUseCase } from './application/get-transaction.use-case';
import { ReverseTransactionUseCase } from './application/reverse-transaction.use-case';
import { ReverseTransferUseCase } from './application/reverse-transfer.use-case';
import { TransactionsController } from './presentation/transactions.controller';
import { FinancialReversalsController } from './presentation/financial-reversals.controller';
import { InstallmentPlansController } from './presentation/installment-plans.controller';
import { CreateInstallmentPlanUseCase } from './application/installments/create-installment-plan.use-case';
import { ListInstallmentPlansUseCase } from './application/installments/list-installment-plans.use-case';
import { PayInstallmentUseCase } from './application/installments/pay-installment.use-case';

@Module({
  imports: [PrismaModule, IdentityModule, TenantModule, BillingModule],
  controllers: [TransactionsController, FinancialReversalsController, InstallmentPlansController],
  providers: [
    CreateTransactionUseCase,
    CreateTransferUseCase,
    ListTransfersUseCase,
    ListTransactionsUseCase,
    ListFinancialHistoryUseCase,
    GetTransactionUseCase,
    ReverseTransactionUseCase,
    ReverseTransferUseCase,
    CreateInstallmentPlanUseCase,
    ListInstallmentPlansUseCase,
    PayInstallmentUseCase,
  ],
})
export class TransactionsModule {}
