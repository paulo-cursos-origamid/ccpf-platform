import { PrismaClient, Prisma } from '@prisma/client';

const TEST_DATABASE_NAME = 'ccpf_financial_test';

describe('Financial Database Integration', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL não configurada.');
    }

    const parsedUrl = new URL(databaseUrl);

    if (parsedUrl.pathname !== `/${TEST_DATABASE_NAME}`) {
      throw new Error(
        `Banco não autorizado para testes: ${parsedUrl.pathname}`,
      );
    }

    prisma = new PrismaClient();

    await prisma.$connect();
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('utiliza exclusivamente o banco financeiro de testes', async () => {
    const result = await prisma.$queryRaw<
      Array<{ database_name: string }>
    >`SELECT current_database() AS database_name`;

    expect(result[0].database_name).toBe(TEST_DATABASE_NAME);
  });

  it('executa transações com isolamento SERIALIZABLE', async () => {
    const isolationLevel = await prisma.$transaction(
      async (tx) => {
        const result = await tx.$queryRaw<
          Array<{ transaction_isolation: string }>
        >`SHOW transaction_isolation`;

        return result[0].transaction_isolation;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    expect(isolationLevel).toBe('serializable');
  });

  it("executa rollback real quando ocorre uma exceção", async () => {
    const marker = "CCPF_ROLLBACK_" + Date.now() + "_" + Math.random().toString(36).slice(2);

    await expect(
      prisma.$transaction(
        async (tx) => {
          await tx.plan.create({
            data: {
              name: "Rollback de integração",
              code: marker,
              maxUsers: 1,
              maxTenants: 1,
            },
          });

          const inserted = await tx.plan.findUnique({
            where: { code: marker },
          });

          expect(inserted).not.toBeNull();
          throw new Error("ROLLBACK_TEST");
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    ).rejects.toThrow("ROLLBACK_TEST");

    const persisted = await prisma.plan.findUnique({
      where: { code: marker },
    });

    expect(persisted).toBeNull();
  });
});
