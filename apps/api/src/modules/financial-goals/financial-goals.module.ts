import { Module } from '@nestjs/common';

import { TenantModule } from '../tenant/tenant.module';
import { BillingModule } from '../billing/billing.module';
import { AccountsModule } from '../accounts/accounts.module';

import { AccountRepository } from '../accounts/domain/repositories/account.repository';
import { AccountMemberRepository } from '../accounts/domain/repositories/account-member.repository';
import { PrismaAccountRepository } from '../accounts/infrastructure/persistence/prisma-account.repository';
import { PrismaAccountMemberRepository } from '../accounts/infrastructure/persistence/prisma-account-member.repository';

import { FinancialGoalRepository } from './domain/repositories/financial-goal.repository';
import { PrismaFinancialGoalRepository } from './infrastructure/persistence/prisma-financial-goal.repository';

import { CreateFinancialGoalUseCase } from './application/use-cases/create-financial-goal/create-financial-goal.use-case';
import { ListFinancialGoalsUseCase } from './application/use-cases/list-financial-goals/list-financial-goals.use-case';
import { GetFinancialGoalUseCase } from './application/use-cases/get-financial-goal/get-financial-goal.use-case';
import { UpdateFinancialGoalUseCase } from './application/use-cases/update-financial-goal/update-financial-goal.use-case';
import { ArchiveFinancialGoalUseCase } from './application/use-cases/archive-financial-goal/archive-financial-goal.use-case';
import { AddFinancialGoalContributionUseCase } from './application/use-cases/add-financial-goal-contribution/add-financial-goal-contribution.use-case';
import { ListFinancialGoalContributionsUseCase } from './application/use-cases/list-financial-goal-contributions/list-financial-goal-contributions.use-case';
import { RemoveFinancialGoalContributionUseCase } from './application/use-cases/remove-financial-goal-contribution/remove-financial-goal-contribution.use-case';

import { FinancialGoalsController } from './presentation/controllers/financial-goals.controller';

@Module({
  imports: [TenantModule, BillingModule, AccountsModule],
  controllers: [FinancialGoalsController],
  providers: [
    CreateFinancialGoalUseCase,
    ListFinancialGoalsUseCase,
    GetFinancialGoalUseCase,
    UpdateFinancialGoalUseCase,
    ArchiveFinancialGoalUseCase,
    AddFinancialGoalContributionUseCase,
    ListFinancialGoalContributionsUseCase,
    RemoveFinancialGoalContributionUseCase,
    {
      provide: FinancialGoalRepository,
      useClass: PrismaFinancialGoalRepository,
    },
    {
      provide: AccountRepository,
      useClass: PrismaAccountRepository,
    },
    {
      provide: AccountMemberRepository,
      useClass: PrismaAccountMemberRepository,
    },
  ],
  exports: [FinancialGoalRepository],
})
export class FinancialGoalsModule {}
