import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { TenantModule } from '../tenant/tenant.module';
import { CreditCardRepository } from './domain/repositories/credit-card.repository';
import { PrismaCreditCardRepository } from './infrastructure/persistence/prisma-credit-card.repository';
import { CreateCreditCardUseCase } from './application/use-cases/create-credit-card/create-credit-card.use-case';
import { ListCreditCardsUseCase } from './application/use-cases/list-credit-cards/list-credit-cards.use-case';
import { GetCreditCardUseCase } from './application/use-cases/get-credit-card/get-credit-card.use-case';
import { UpdateCreditCardUseCase } from './application/use-cases/update-credit-card/update-credit-card.use-case';
import { ArchiveCreditCardUseCase } from './application/use-cases/archive-credit-card/archive-credit-card.use-case';
import { CreateCreditCardPurchaseUseCase } from './application/use-cases/create-credit-card-purchase/create-credit-card-purchase.use-case';
import { CreditCardsController } from './presentation/credit-cards.controller';

import { AccountsPayableReceivableModule } from '../accounts-payable-receivable/accounts-payable-receivable.module';
import { PayCreditCardInvoiceUseCase } from './application/use-cases/pay-credit-card-invoice/pay-credit-card-invoice.use-case';
import { ListCreditCardInvoicesUseCase } from './application/use-cases/list-credit-card-invoices/list-credit-card-invoices.use-case';
import { GetCreditCardInvoiceUseCase } from './application/use-cases/get-credit-card-invoice/get-credit-card-invoice.use-case';

@Module({
  imports: [
    TenantModule,
    BillingModule,
    AccountsPayableReceivableModule,
  ],
  controllers: [CreditCardsController],
  providers: [
    {
      provide: CreditCardRepository,
      useClass: PrismaCreditCardRepository,
    },
    CreateCreditCardUseCase,
    ListCreditCardsUseCase,
    GetCreditCardUseCase,
    UpdateCreditCardUseCase,
    ArchiveCreditCardUseCase,
    CreateCreditCardPurchaseUseCase,
    PayCreditCardInvoiceUseCase,
    ListCreditCardInvoicesUseCase,
    GetCreditCardInvoiceUseCase,
  ],
  exports: [
    CreateCreditCardUseCase,
    ListCreditCardsUseCase,
    GetCreditCardUseCase,
    UpdateCreditCardUseCase,
    ArchiveCreditCardUseCase,
    CreateCreditCardPurchaseUseCase,
    PayCreditCardInvoiceUseCase,
    ListCreditCardInvoicesUseCase,
    GetCreditCardInvoiceUseCase,
  ],
})
export class CreditCardsModule {}
