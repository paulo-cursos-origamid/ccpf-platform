import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { CreditCardsController } from '../src/modules/credit-cards/presentation/credit-cards.controller';
import { CreateCreditCardUseCase } from '../src/modules/credit-cards/application/use-cases/create-credit-card/create-credit-card.use-case';
import { ListCreditCardsUseCase } from '../src/modules/credit-cards/application/use-cases/list-credit-cards/list-credit-cards.use-case';
import { GetCreditCardUseCase } from '../src/modules/credit-cards/application/use-cases/get-credit-card/get-credit-card.use-case';
import { UpdateCreditCardUseCase } from '../src/modules/credit-cards/application/use-cases/update-credit-card/update-credit-card.use-case';
import { ArchiveCreditCardUseCase } from '../src/modules/credit-cards/application/use-cases/archive-credit-card/archive-credit-card.use-case';
import { JwtAuthGuard } from '../src/modules/identity/infrastructure/auth/jwt-auth.guard';
import { TenantContextGuard } from '../src/modules/tenant/presentation/guards/tenant-context.guard';
import type { TenantContext } from '../src/modules/tenant/presentation/interfaces/tenant-context.interface';
import { SubscriptionAccessGuard } from '../src/modules/billing/presentation/guards/subscription-access.guard';

import { CreateCreditCardPurchaseUseCase } from '../src/modules/credit-cards/application/use-cases/create-credit-card-purchase/create-credit-card-purchase.use-case';
import { GetCreditCardInvoiceUseCase } from '../src/modules/credit-cards/application/use-cases/get-credit-card-invoice/get-credit-card-invoice.use-case';
import { ListCreditCardInvoicesUseCase } from '../src/modules/credit-cards/application/use-cases/list-credit-card-invoices/list-credit-card-invoices.use-case';
import { PayCreditCardInvoiceUseCase } from '../src/modules/credit-cards/application/use-cases/pay-credit-card-invoice/pay-credit-card-invoice.use-case';
describe('Credit Cards API (e2e)', () => {
  let app: INestApplication;

  const createCard = { execute: jest.fn() };
  const listCards = { execute: jest.fn() };
  const getCard = { execute: jest.fn() };
  const updateCard = { execute: jest.fn() };
  const archiveCard = { execute: jest.fn() };

  const tenantContext: TenantContext = {
    tenantId: 'tenant-http',
    userId: 'user-http',
  } as TenantContext;

  const cardOutput = {
    id: 'card-1',
    tenantId: 'tenant-http',
    name: 'Cartão principal',
    brand: 'VISA',
    lastFourDigits: '1234',
    creditLimit: 5000,
    closingDay: 10,
    dueDay: 20,
    status: 'ACTIVE',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CreditCardsController],
      providers: [
        { provide: CreateCreditCardUseCase, useValue: createCard },
        { provide: ListCreditCardsUseCase, useValue: listCards },
        { provide: GetCreditCardUseCase, useValue: getCard },
        { provide: UpdateCreditCardUseCase, useValue: updateCard },
        { provide: ArchiveCreditCardUseCase, useValue: archiveCard },
      
        { provide: CreateCreditCardPurchaseUseCase, useValue: { execute: jest.fn() } },
        { provide: GetCreditCardInvoiceUseCase, useValue: { execute: jest.fn() } },
        { provide: ListCreditCardInvoicesUseCase, useValue: { execute: jest.fn() } },
        { provide: PayCreditCardInvoiceUseCase, useValue: { execute: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(TenantContextGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest<{
            tenantContext?: TenantContext;
          }>();
          req.tenantContext = tenantContext;
          return true;
        },
      })
      .overrideGuard(SubscriptionAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    createCard.execute.mockResolvedValue(cardOutput);
    listCards.execute.mockResolvedValue([cardOutput]);
    getCard.execute.mockResolvedValue(cardOutput);
    updateCard.execute.mockResolvedValue(cardOutput);
    archiveCard.execute.mockResolvedValue({ id: 'card-1', status: 'ARCHIVED' });
  });

  afterAll(async () => {
    await app?.close();
  });

  it('POST /api/v1/credit-cards cadastra cartão no tenant do contexto', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/credit-cards')
      .send({
        name: 'Cartão principal',
        brand: 'VISA',
        lastFourDigits: '1234',
        creditLimit: '5000',
        closingDay: '10',
        dueDay: '20',
        tenantId: 'tenant-forjado',
      })
      .expect(201);

    expect(createCard.execute).toHaveBeenCalledWith({
      name: 'Cartão principal',
      brand: 'VISA',
      lastFourDigits: '1234',
      creditLimit: 5000,
      closingDay: 10,
      dueDay: 20,
      tenantId: 'tenant-http',
      userId: 'user-http',
    });
  });

  it('GET /api/v1/credit-cards lista cartões do tenant do contexto', async () => {
    await request(app.getHttpServer()).get('/api/v1/credit-cards').expect(200);

    expect(listCards.execute).toHaveBeenCalledWith({
      tenantId: 'tenant-http',
      userId: 'user-http',
    });
  });

  it('GET /api/v1/credit-cards/:id consulta cartão no tenant do contexto', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/credit-cards/card-1')
      .expect(200);

    expect(getCard.execute).toHaveBeenCalledWith({
      cardId: 'card-1',
      tenantId: 'tenant-http',
      userId: 'user-http',
    });
  });

  it('PATCH /api/v1/credit-cards/:id aceita atualização parcial', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/credit-cards/card-1')
      .send({ name: 'Novo nome' })
      .expect(200);

    expect(updateCard.execute).toHaveBeenCalledWith({
      name: 'Novo nome',
      cardId: 'card-1',
      tenantId: 'tenant-http',
      userId: 'user-http',
    });
  });

  it('PATCH rejeita dados inválidos', async () => {
    await request(app.getHttpServer())
      .patch('/api/v1/credit-cards/card-1')
      .send({ closingDay: 32 })
      .expect(400);

    expect(updateCard.execute).not.toHaveBeenCalled();
  });

  it('POST /api/v1/credit-cards/:id/archive arquiva cartão', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/credit-cards/card-1/archive')
      .expect(201);

    expect(archiveCard.execute).toHaveBeenCalledWith({
      cardId: 'card-1',
      tenantId: 'tenant-http',
      userId: 'user-http',
    });
  });

  it('POST rejeita cartão com dados inválidos', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/credit-cards')
      .send({
        name: 'A',
        brand: 'INVALID',
        creditLimit: 0,
        closingDay: 32,
        dueDay: 0,
      })
      .expect(400);

    expect(createCard.execute).not.toHaveBeenCalled();
  });
});
