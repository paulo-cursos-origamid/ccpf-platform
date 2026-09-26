import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';

describe('Billing API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mantém o ambiente E2E alinhado ao runtime real definido em main.ts.
    app.setGlobalPrefix('api/v1');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  /**
   * Valida uma rota pública real da API.
   *
   * O teste confirma que:
   * - o AppModule inicializa;
   * - o prefixo global /api/v1 está aplicado;
   * - o BillingModule está disponível;
   * - os planos públicos podem ser consultados.
   */
  it('GET /api/v1/billing/plans', async () => {
    // O tipo retornado por Nest para getHttpServer() não é reconhecido
    // diretamente pelo contrato do supertest.
    // A exceção fica limitada a esta chamada.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const response = await request(app.getHttpServer())
      .get('/api/v1/billing/plans')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);

    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'TRIAL',
        }),
        expect.objectContaining({
          code: 'BASIC',
        }),
        expect.objectContaining({
          code: 'PRO',
        }),
        expect.objectContaining({
          code: 'PREMIUM',
        }),
      ]),
    );
  });
});
