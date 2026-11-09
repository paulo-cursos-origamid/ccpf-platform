jest.mock("@nestjs/schedule", () => { const nestCommon = jest.requireActual("@nestjs/common"); class ScheduleModuleMock {} nestCommon.Module({})(ScheduleModuleMock); return { Cron: () => () => undefined, ScheduleModule: { forRoot: () => ({ module: ScheduleModuleMock }) } }; });
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';

describe('Billing API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService | undefined;
  const createdPlanIds: string[] = [];

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error("DATABASE_URL não configurada para E2E.");
    }

    const parsedDatabaseUrl = new URL(databaseUrl);

    if (parsedDatabaseUrl.pathname !== "/ccpf_financial_test") {
      throw new Error(
        "Banco não autorizado para E2E: " + parsedDatabaseUrl.pathname,
      );
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mantém o ambiente E2E alinhado ao runtime real definido em main.ts.
    app.setGlobalPrefix('api/v1');

    await app.init();
    prisma = app.get(PrismaService);

    const publicPlans = [
      {
        name: "Plano Trial",
        code: "TRIAL",
        maxUsers: 2,
        maxTenants: 1,
      },
      {
        name: "Plano Básico",
        code: "BASIC",
        maxUsers: 3,
        maxTenants: 1,
      },
      {
        name: "Plano Pro",
        code: "PRO",
        maxUsers: 5,
        maxTenants: 3,
      },
      {
        name: "Plano Premium",
        code: "PREMIUM",
        maxUsers: 10,
        maxTenants: 10,
      },
    ];

    const insertedPlanIds = await prisma.$transaction(async (tx) => {
      const ids: string[] = [];

      for (const plan of publicPlans) {
        const existing = await tx.plan.findUnique({
          where: { code: plan.code },
          select: {
            id: true,
            isPublic: true,
            isActive: true,
          },
        });

        if (existing) {
          if (!existing.isPublic || !existing.isActive) {
            throw new Error(
              "O plano " + plan.code +
              " já existe, mas não está público e ativo no banco de testes.",
            );
          }

          continue;
        }

        const created = await tx.plan.create({
          data: {
            ...plan,
            isPublic: true,
            isActive: true,
          },
          select: { id: true },
        });

        ids.push(created.id);
      }

      return ids;
    });

    createdPlanIds.push(...insertedPlanIds);
  });

  afterAll(async () => {
    try {
      if (prisma && createdPlanIds.length > 0) {
        await prisma.plan.deleteMany({
          where: {
            id: { in: createdPlanIds },
          },
        });
      }
    } finally {
      if (app) {
        await app.close();
      }
    }
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
