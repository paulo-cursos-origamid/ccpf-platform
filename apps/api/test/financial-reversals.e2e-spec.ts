import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import request from 'supertest';

import { FinancialReversalsController } from '../src/modules/transactions/presentation/financial-reversals.controller';
import { JwtAuthGuard } from '../src/modules/identity/infrastructure/auth/jwt-auth.guard';
import { PlatformPermissionGuard } from '../src/modules/identity/presentation/guards/platform-permission.guard';
import { PlatformAuthorizationRepository } from '../src/modules/identity/domain/repositories/platform-authorization.repository';
import { ReverseTransactionUseCase } from '../src/modules/transactions/application/reverse-transaction.use-case';
import { ReverseTransferUseCase } from '../src/modules/transactions/application/reverse-transfer.use-case';

describe('Financial reversals API (e2e)', () => {
  let app: INestApplication;

  const reverseTransaction = { execute: jest.fn() };
  const reverseTransfer = { execute: jest.fn() };
  const authorizationRepository = { userHasPermission: jest.fn() };

  let authenticatedUserId = 'platform-admin-1';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [FinancialReversalsController],
      providers: [
        Reflector,
        PlatformPermissionGuard,
        {
          provide: PlatformAuthorizationRepository,
          useValue: authorizationRepository,
        },
        { provide: ReverseTransactionUseCase, useValue: reverseTransaction },
        { provide: ReverseTransferUseCase, useValue: reverseTransfer },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          context.switchToHttp().getRequest().user = {
            sub: authenticatedUserId,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    authenticatedUserId = 'platform-admin-1';
    authorizationRepository.userHasPermission.mockResolvedValue(true);
    reverseTransaction.execute.mockResolvedValue({ transactionId: 'tx-1' });
    reverseTransfer.execute.mockResolvedValue({ transferId: 'transfer-1' });
  });

  afterAll(async () => {
    await app.close();
  });

  it('autoriza transação consultando a permissão global exigida', async () => {
    await request(app.getHttpServer())
      .post(
        '/api/v1/platform-admin/financial-reversals/tenants/tenant-a/transactions/tx-1',
      )
      .expect(201);

    expect(authorizationRepository.userHasPermission).toHaveBeenCalledWith(
      'platform-admin-1',
      'FINANCIAL_REVERSALS_MANAGE',
    );

    expect(reverseTransaction.execute).toHaveBeenCalledWith({
      id: 'tx-1',
      tenantId: 'tenant-a',
      userId: 'platform-admin-1',
    });
  });

  it('autoriza transferência consultando a permissão global exigida', async () => {
    await request(app.getHttpServer())
      .post(
        '/api/v1/platform-admin/financial-reversals/tenants/tenant-a/transfers/transfer-1',
      )
      .expect(201);

    expect(authorizationRepository.userHasPermission).toHaveBeenCalledWith(
      'platform-admin-1',
      'FINANCIAL_REVERSALS_MANAGE',
    );

    expect(reverseTransfer.execute).toHaveBeenCalledWith({
      id: 'transfer-1',
      tenantId: 'tenant-a',
      userId: 'platform-admin-1',
    });
  });

  it('bloqueia usuário sem permissão global antes de executar o estorno', async () => {
    authorizationRepository.userHasPermission.mockResolvedValue(false);

    await request(app.getHttpServer())
      .post(
        '/api/v1/platform-admin/financial-reversals/tenants/tenant-a/transactions/tx-1',
      )
      .expect(403);

    expect(authorizationRepository.userHasPermission).toHaveBeenCalledWith(
      'platform-admin-1',
      'FINANCIAL_REVERSALS_MANAGE',
    );
    expect(reverseTransaction.execute).not.toHaveBeenCalled();
  });

  it('usa o Espaço informado na rota sem substituí-lo', async () => {
    await request(app.getHttpServer())
      .post(
        '/api/v1/platform-admin/financial-reversals/tenants/tenant-b/transfers/transfer-2',
      )
      .expect(201);

    expect(reverseTransfer.execute).toHaveBeenCalledWith({
      id: 'transfer-2',
      tenantId: 'tenant-b',
      userId: 'platform-admin-1',
    });
  });
});
