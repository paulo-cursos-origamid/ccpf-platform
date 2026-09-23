import { Module } from '@nestjs/common';

import { AccountRepository } from './domain/repositories/account.repository';

import { PrismaAccountRepository } from './infrastructure/persistence/prisma-account.repository';

import { CreateAccountUseCase } from './application/use-cases/create-account/create-account.use-case';

import { AccountsController } from './presentation/controllers/accounts.controller';

import { AccountMemberRepository } from './domain/repositories/account-member.repository';
import { PrismaAccountMemberRepository } from './infrastructure/persistence/prisma-account-member.repository';
import { ListAccountsUseCase } from './application/use-cases/list-accounts/list-accounts.use-case';
import { GetAccountUseCase } from './application/use-cases/get-account/get-account.use-case';
import { UpdateAccountUseCase } from './application/use-cases/update-account/update-account.use-case';
import { AddAccountMemberUseCase } from './application/use-cases/add-account-member/add-account-member.use-case';
import { ListAccountMembersUseCase } from './application/use-cases/list-account-members/list-account-members.use-case';
import { ListAvailableAccountUsersUseCase } from './application/use-cases/list-available-account-users/list-available-account-users.use-case';
import { IdentityModule } from '../identity/identity.module';
import { TenantModule } from '../tenant/tenant.module';
import { BillingModule } from '../billing/billing.module';
import { UpdateAccountMemberRoleUseCase } from './application/use-cases/update-account-member-role/update-account-member-role.use-case';
import { BlockAccountMemberUseCase } from './application/use-cases/block-account-member/block-account-member.use-case';
import { UnblockAccountMemberUseCase } from './application/use-cases/unblock-account-member/unblock-account-member.use-case';

@Module({
  imports: [IdentityModule, TenantModule, BillingModule],
  controllers: [AccountsController],

  providers: [
    CreateAccountUseCase,
    ListAccountsUseCase,
    GetAccountUseCase,
    UpdateAccountUseCase,
    AddAccountMemberUseCase,
    ListAccountMembersUseCase,
    ListAvailableAccountUsersUseCase,
    UpdateAccountMemberRoleUseCase,
    BlockAccountMemberUseCase,
    UnblockAccountMemberUseCase,

    {
      provide: AccountRepository,
      useClass: PrismaAccountRepository,
    },
    {
      provide: AccountMemberRepository,
      useClass: PrismaAccountMemberRepository,
    },
  ],

  exports: [CreateAccountUseCase],
})
export class AccountsModule {}
