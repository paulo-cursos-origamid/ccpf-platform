import { Module } from '@nestjs/common';

import { AccountRepository } from './domain/repositories/account.repository';

import { PrismaAccountRepository } from './infrastructure/persistence/prisma-account.repository';

import { CreateAccountUseCase } from './application/use-cases/create-account/create-account.use-case';

import { AccountsController } from './presentation/controllers/accounts.controller';

import { AccountMemberRepository } from './domain/repositories/account-member.repository';
import { PrismaAccountMemberRepository } from './infrastructure/persistence/prisma-account-member.repository';
import { ListAccountsUseCase } from './application/use-cases/list-accounts/list-accounts.use-case';
import { GetAccountUseCase } from './application/use-cases/get-account/get-account.use-case';
import { AddAccountMemberUseCase } from './application/use-cases/add-account-member/add-account-member.use-case';

@Module({
  controllers: [AccountsController],

  providers: [
    CreateAccountUseCase,
    ListAccountsUseCase,
    GetAccountUseCase,
    AddAccountMemberUseCase,

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
