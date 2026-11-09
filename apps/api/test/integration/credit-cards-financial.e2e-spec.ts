import { randomUUID } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../../src/infrastructure/database/prisma.service';

import { TenantMemberRepository } from '../../src/modules/tenant/domain/repositories/tenant-member.repository';
import { PrismaTenantMemberRepository } from '../../src/modules/tenant/infrastructure/persistence/prisma-tenant-member.repository';

import { AccountRepository } from '../../src/modules/accounts/domain/repositories/account.repository';
import { PrismaAccountRepository } from '../../src/modules/accounts/infrastructure/persistence/prisma-account.repository';

import { AccountMemberRepository } from '../../src/modules/accounts/domain/repositories/account-member.repository';
import { PrismaAccountMemberRepository } from '../../src/modules/accounts/infrastructure/persistence/prisma-account-member.repository';

import { CategoryRepository } from '../../src/modules/categories/domain/repositories/category.repository';
import { PrismaCategoryRepository } from '../../src/modules/categories/infrastructure/persistence/prisma-category.repository';

import { FinancialObligationRepository } from '../../src/modules/accounts-payable-receivable/domain/repositories/financial-obligation.repository';
import { PrismaFinancialObligationRepository } from '../../src/modules/accounts-payable-receivable/infrastructure/persistence/prisma-financial-obligation.repository';

import { FinancialObligationsApplicationService } from '../../src/modules/accounts-payable-receivable/application/financial-obligations-application.service';

import { SettleFinancialObligationUseCase } from '../../src/modules/accounts-payable-receivable/application/use-cases/settle-financial-obligation/settle-financial-obligation.use-case';

import { CreateCreditCardPurchaseUseCase } from '../../src/modules/credit-cards/application/use-cases/create-credit-card-purchase/create-credit-card-purchase.use-case';

import { PayCreditCardInvoiceUseCase } from '../../src/modules/credit-cards/application/use-cases/pay-credit-card-invoice/pay-credit-card-invoice.use-case';

const TEST_DATABASE_NAME = 'ccpf_financial_test';

const fixture = {
  tenantId: randomUUID(),
  userId: randomUUID(),
  accountId: randomUUID(),
  categoryId: randomUUID(),
  creditCardId: randomUUID(),
};

describe('Credit Cards Financial Integration', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;

  let createPurchase: CreateCreditCardPurchaseUseCase;
  let payInvoice: PayCreditCardInvoiceUseCase;

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada.');
    }

    const parsedUrl = new URL(databaseUrl);

    if (parsedUrl.pathname !== `/${TEST_DATABASE_NAME}`) {
      throw new Error(
        `Banco não autorizado para integração financeira: ${parsedUrl.pathname}`,
      );
    }

    moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,

        {
          provide: TenantMemberRepository,
          useClass: PrismaTenantMemberRepository,
        },
        {
          provide: AccountRepository,
          useClass: PrismaAccountRepository,
        },
        {
          provide: AccountMemberRepository,
          useClass: PrismaAccountMemberRepository,
        },
        {
          provide: CategoryRepository,
          useClass: PrismaCategoryRepository,
        },
        {
          provide: FinancialObligationRepository,
          useClass: PrismaFinancialObligationRepository,
        },

        FinancialObligationsApplicationService,
        SettleFinancialObligationUseCase,
        CreateCreditCardPurchaseUseCase,
        PayCreditCardInvoiceUseCase,
      ],
    }).compile();

    await moduleRef.init();

    prisma = moduleRef.get(PrismaService);

    createPurchase = moduleRef.get(CreateCreditCardPurchaseUseCase);
    payInvoice = moduleRef.get(PayCreditCardInvoiceUseCase);

    await createFixtures();
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await cleanupFixtures();
      }
    } finally {
      await moduleRef?.close();
    }
  });

  async function createFixtures(): Promise<void> {
    await prisma.user.create({
      data: {
        id: fixture.userId,
        name: 'Usuário de integração de cartões',
        email: `credit-card-${fixture.userId}@example.test`,
        password: 'integration-test-only',
      },
    });

    await prisma.tenant.create({
      data: {
        id: fixture.tenantId,
        name: 'Tenant de integração de cartões',
        slug: `credit-card-${fixture.tenantId}`,
        status: 'ACTIVE',
      },
    });

    await prisma.tenantMember.create({
      data: {
        tenantId: fixture.tenantId,
        userId: fixture.userId,
        role: 'OWNER',
        status: 'ACTIVE',
        origin: 'EXISTING_USER',
      },
    });

    await prisma.account.create({
      data: {
        id: fixture.accountId,
        tenantId: fixture.tenantId,
        name: 'Conta de testes',
        type: 'CHECKING',
        currency: 'BRL',
        initialBalance: new Prisma.Decimal('1000.00'),
        balance: new Prisma.Decimal('1000.00'),
        status: 'ACTIVE',
      },
    });

    await prisma.accountMember.create({
      data: {
        accountId: fixture.accountId,
        userId: fixture.userId,
        role: 'OWNER',
        status: 'ACTIVE',
      },
    });

    await prisma.category.create({
      data: {
        id: fixture.categoryId,
        tenantId: fixture.tenantId,
        name: 'Despesas de integração',
        slug: `despesas-integracao-${fixture.categoryId}`,
        type: 'EXPENSE',
      },
    });

    await prisma.creditCard.create({
      data: {
        id: fixture.creditCardId,
        tenantId: fixture.tenantId,
        name: 'Cartão de integração',
        brand: 'VISA',
        lastFourDigits: '1234',
        creditLimit: new Prisma.Decimal('10000.00'),
        closingDay: 10,
        dueDay: 20,
        status: 'ACTIVE',
      },
    });
  }

  async function cleanupFixtures(): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.financialObligationSettlement.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.ledgerEntry.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.transaction.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.financialObligation.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.creditCardInstallment.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.creditCardPurchase.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.creditCardInvoice.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.accountMember.deleteMany({
        where: { accountId: fixture.accountId },
      });

      await tx.creditCard.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.account.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.category.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.tenantMember.deleteMany({
        where: { tenantId: fixture.tenantId },
      });

      await tx.tenant.deleteMany({
        where: { id: fixture.tenantId },
      });

      await tx.user.deleteMany({
        where: { id: fixture.userId },
      });
    });
  }

  it('persiste compra parcelada, liquida parcialmente e integralmente a fatura sem duplicar despesas', async () => {
    // --------------------------------------------------
    // 1. REGISTRAR COMPRA PARCELADA
    // --------------------------------------------------

    const purchase = await createPurchase.execute({
      tenantId: fixture.tenantId,
      userId: fixture.userId,
      creditCardId: fixture.creditCardId,
      categoryId: fixture.categoryId,
      title: 'Compra de integração',
      totalAmount: '100.00',
      purchaseDate: '2026-11-08T12:00:00.000Z',
      installmentCount: 2,
    });

    expect(purchase.installments).toHaveLength(2);

    expect(
      purchase.installments.map((item) => item.amount.toFixed(2)),
    ).toEqual(['50.00', '50.00']);

    const firstInvoiceId = purchase.installments[0].invoice.id;
    const secondInvoiceId = purchase.installments[1].invoice.id;

    expect(firstInvoiceId).not.toBe(secondInvoiceId);

    // --------------------------------------------------
    // 2. VALIDAR PERSISTÊNCIA E AUSÊNCIA DE MOVIMENTAÇÃO
    // --------------------------------------------------

    const invoices = await prisma.creditCardInvoice.findMany({
      where: { tenantId: fixture.tenantId },
    });

    expect(invoices).toHaveLength(2);

    const obligations = await prisma.financialObligation.findMany({
      where: {
        tenantId: fixture.tenantId,
        sourceType: 'CREDIT_CARD_INVOICE',
      },
    });

    expect(obligations).toHaveLength(2);

    expect(
      obligations.every((item) => item.status === 'PENDING'),
    ).toBe(true);

    expect(
      obligations.every((item) => item.amount.toFixed(2) === '50.00'),
    ).toBe(true);

    expect(
      await prisma.transaction.count({
        where: { tenantId: fixture.tenantId },
      }),
    ).toBe(0);

    expect(
      await prisma.ledgerEntry.count({
        where: { tenantId: fixture.tenantId },
      }),
    ).toBe(0);

    let account = await prisma.account.findUniqueOrThrow({
      where: { id: fixture.accountId },
    });

    expect(account.balance.toFixed(2)).toBe('1000.00');

    // --------------------------------------------------
    // 2.1. VIEWER DO TENANT NÃO PODE PAGAR A FATURA
    // --------------------------------------------------

    await prisma.tenantMember.update({
      where: {
        tenantId_userId: {
          tenantId: fixture.tenantId,
          userId: fixture.userId,
        },
      },
      data: { role: 'VIEWER' },
    });

    await expect(
      payInvoice.execute({
        invoiceId: firstInvoiceId,
        tenantId: fixture.tenantId,
        userId: fixture.userId,
        accountId: fixture.accountId,
        settledAt: new Date('2026-11-20T12:00:00.000Z'),
        principalAmount: '20.00',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(
      await prisma.financialObligationSettlement.count({
        where: { tenantId: fixture.tenantId },
      }),
    ).toBe(0);

    expect(
      await prisma.ledgerEntry.count({
        where: { tenantId: fixture.tenantId },
      }),
    ).toBe(0);

    account = await prisma.account.findUniqueOrThrow({
      where: { id: fixture.accountId },
    });

    expect(account.balance.toFixed(2)).toBe('1000.00');

    await prisma.tenantMember.update({
      where: {
        tenantId_userId: {
          tenantId: fixture.tenantId,
          userId: fixture.userId,
        },
      },
      data: { role: 'OWNER' },
    });

    // --------------------------------------------------
    // 3. PAGAMENTO PARCIAL DA PRIMEIRA FATURA
    // --------------------------------------------------

    await payInvoice.execute({
      invoiceId: firstInvoiceId,
      tenantId: fixture.tenantId,
      userId: fixture.userId,
      accountId: fixture.accountId,
      settledAt: new Date('2026-11-20T12:00:00.000Z'),
      principalAmount: '20.00',
      discountAmount: '0.00',
    });

    let firstObligation = await prisma.financialObligation.findFirstOrThrow({
      where: {
        tenantId: fixture.tenantId,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: firstInvoiceId,
      },
    });

    expect(firstObligation.status).toBe('PARTIALLY_SETTLED');

    let firstInvoice = await prisma.creditCardInvoice.findUniqueOrThrow({
      where: { id: firstInvoiceId },
    });

    expect(firstInvoice.status).toBe('OPEN');

    account = await prisma.account.findUniqueOrThrow({
      where: { id: fixture.accountId },
    });

    expect(account.balance.toFixed(2)).toBe('980.00');

    let ledgerEntries = await prisma.ledgerEntry.findMany({
      where: { tenantId: fixture.tenantId },
    });

    expect(ledgerEntries).toHaveLength(1);
    expect(ledgerEntries[0].type).toBe('DEBIT');
    expect(ledgerEntries[0].amount.toFixed(2)).toBe('20.00');
    expect(ledgerEntries[0].referenceType).toBe(
      'CREDIT_CARD_INVOICE_PAYMENT',
    );

    // --------------------------------------------------
    // 4. QUITAR O SALDO RESTANTE DA PRIMEIRA FATURA
    // --------------------------------------------------

    await payInvoice.execute({
      invoiceId: firstInvoiceId,
      tenantId: fixture.tenantId,
      userId: fixture.userId,
      accountId: fixture.accountId,
      settledAt: new Date('2026-11-21T12:00:00.000Z'),
      principalAmount: '30.00',
    });

    firstObligation = await prisma.financialObligation.findFirstOrThrow({
      where: {
        tenantId: fixture.tenantId,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: firstInvoiceId,
      },
    });

    expect(firstObligation.status).toBe('SETTLED');

    firstInvoice = await prisma.creditCardInvoice.findUniqueOrThrow({
      where: { id: firstInvoiceId },
    });

    expect(firstInvoice.status).toBe('PAID');

    account = await prisma.account.findUniqueOrThrow({
      where: { id: fixture.accountId },
    });

    expect(account.balance.toFixed(2)).toBe('950.00');

    ledgerEntries = await prisma.ledgerEntry.findMany({
      where: { tenantId: fixture.tenantId },
    });

    expect(ledgerEntries).toHaveLength(2);

    expect(
      ledgerEntries.map((entry) => entry.amount.toFixed(2)).sort(),
    ).toEqual(['20.00', '30.00']);

    // --------------------------------------------------
    // 5. QUITAR A SEGUNDA FATURA COM DESCONTO INTEGRAL
    // --------------------------------------------------

    await payInvoice.execute({
      invoiceId: secondInvoiceId,
      tenantId: fixture.tenantId,
      userId: fixture.userId,
      accountId: fixture.accountId,
      settledAt: new Date('2026-12-20T12:00:00.000Z'),
      principalAmount: '50.00',
      discountAmount: '50.00',
    });

    const secondObligation =
      await prisma.financialObligation.findFirstOrThrow({
        where: {
          tenantId: fixture.tenantId,
          sourceType: 'CREDIT_CARD_INVOICE',
          sourceId: secondInvoiceId,
        },
      });

    expect(secondObligation.status).toBe('SETTLED');

    const secondInvoice = await prisma.creditCardInvoice.findUniqueOrThrow({
      where: { id: secondInvoiceId },
    });

    expect(secondInvoice.status).toBe('PAID');

    const discountSettlement =
      await prisma.financialObligationSettlement.findFirstOrThrow({
        where: {
          tenantId: fixture.tenantId,
          obligationId: secondObligation.id,
        },
      });

    expect(discountSettlement.discountAmount.toFixed(2)).toBe('50.00');
    expect(discountSettlement.settledAmount.toFixed(2)).toBe('0.00');

    account = await prisma.account.findUniqueOrThrow({
      where: { id: fixture.accountId },
    });

    // Desconto integral não movimenta o saldo.
    expect(account.balance.toFixed(2)).toBe('950.00');

    // Não cria um lançamento contábil de valor zero.
    expect(
      await prisma.ledgerEntry.count({
        where: { tenantId: fixture.tenantId },
      }),
    ).toBe(2);

    // Compra e pagamento de fatura não geram Transaction.
    expect(
      await prisma.transaction.count({
        where: { tenantId: fixture.tenantId },
      }),
    ).toBe(0);
  });

  it('preserves the persisted invoice due date when the card due day changes', async () => {
    const firstPurchase = await createPurchase.execute({
      tenantId: fixture.tenantId,
      userId: fixture.userId,
      creditCardId: fixture.creditCardId,
      categoryId: fixture.categoryId,
      title: 'Compra inicial para vencimento',
      totalAmount: '10.00',
      purchaseDate: '2027-01-05T12:00:00.000Z',
      installmentCount: 1,
    });

    const invoiceId = firstPurchase.installments[0].invoice.id;

    const originalInvoice = await prisma.creditCardInvoice.findUniqueOrThrow({
      where: { id: invoiceId },
    });

    await prisma.creditCard.update({
      where: { id: fixture.creditCardId },
      data: { dueDay: 25 },
    });

    const secondPurchase = await createPurchase.execute({
      tenantId: fixture.tenantId,
      userId: fixture.userId,
      creditCardId: fixture.creditCardId,
      categoryId: fixture.categoryId,
      title: 'Compra após alteração do vencimento',
      totalAmount: '20.00',
      purchaseDate: '2027-01-06T12:00:00.000Z',
      installmentCount: 1,
    });

    const updatedInvoice = await prisma.creditCardInvoice.findUniqueOrThrow({
      where: { id: invoiceId },
    });

    const obligation = await prisma.financialObligation.findFirstOrThrow({
      where: {
        tenantId: fixture.tenantId,
        sourceType: 'CREDIT_CARD_INVOICE',
        sourceId: invoiceId,
      },
    });

    expect(updatedInvoice.dueDate.toISOString()).toBe(
      originalInvoice.dueDate.toISOString(),
    );

    expect(obligation.dueDate.toISOString()).toBe(
      originalInvoice.dueDate.toISOString(),
    );

    expect(secondPurchase.installments[0].dueDate.toISOString()).toBe(
      originalInvoice.dueDate.toISOString(),
    );
  });
});
