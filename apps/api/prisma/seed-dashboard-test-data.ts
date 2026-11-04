import { TransactionType } from '@prisma/client';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { CreateTransactionUseCase } from '../src/modules/transactions/application/create-transaction.use-case';

const prisma = new PrismaService();
const samples = [
  { income: '5400.00', expense: '3100.00' },
  { income: '6200.00', expense: '3800.00' },
  { income: '7100.00', expense: '4200.00' },
  { income: '7900.00', expense: '4900.00' },
  { income: '9500.00', expense: '6100.00' },
  { income: '11500.00', expense: '5700.00' },
];

function assertLocalDatabase() {
  if (process.env.NODE_ENV === 'production' || !process.env.DATABASE_URL) {
    throw new Error('Este seed só pode ser executado com DATABASE_URL local.');
  }

  const hostname = new URL(process.env.DATABASE_URL).hostname;
  if (
    !['localhost', '127.0.0.1', '::1', '[::1]', 'postgres'].includes(hostname)
  ) {
    throw new Error(`Seed bloqueado para o host de banco "${hostname}".`);
  }
}

async function seedDashboardTestData() {
  assertLocalDatabase();
  await prisma.onModuleInit();

  const requestedTenantId = process.env.SEED_TEST_TENANT_ID;
  const tenants = await prisma.tenant.findMany({
    where: {
      status: 'ACTIVE',
      ...(requestedTenantId ? { id: requestedTenantId } : {}),
    },
    include: {
      accounts: {
        where: { archivedAt: null },
        include: {
          accountMembers: {
            where: { status: 'ACTIVE' },
            select: { userId: true, role: true },
          },
        },
      },
      categories: {
        where: { deletedAt: null },
        select: { id: true, type: true },
      },
    },
  });
  const eligibleTenants = tenants.filter(
    (tenant) =>
      tenant.accounts.some((account) => account.accountMembers.length > 0) &&
      tenant.categories.some((category) => category.type === 'INCOME') &&
      tenant.categories.some((category) => category.type === 'EXPENSE'),
  );

  if (eligibleTenants.length !== 1) {
    const options = eligibleTenants.map(
      (tenant) => `${tenant.name} (${tenant.id})`,
    );
    throw new Error(
      options.length
        ? `Informe SEED_TEST_TENANT_ID. Tenants elegíveis: ${options.join(', ')}`
        : 'Nenhum tenant ativo com conta, usuário e categorias de receita/despesa foi encontrado.',
    );
  }

  const tenant = eligibleTenants[0];
  const requestedAccountId = process.env.SEED_TEST_ACCOUNT_ID;
  const requestedUserId = process.env.SEED_TEST_USER_ID;
  const requestedUserEmail =
    process.env.SEED_TEST_USER_EMAIL?.trim().toLowerCase();
  const requestedUser = requestedUserEmail
    ? await prisma.user.findUnique({
        where: { email: requestedUserEmail },
        select: { id: true },
      })
    : null;
  const userId = requestedUserId ?? requestedUser?.id;

  if (requestedUserEmail && !requestedUser) {
    throw new Error('O usuário informado por e-mail não foi encontrado.');
  }

  const eligibleAccounts = tenant.accounts.filter(
    (account) =>
      account.accountMembers.length > 0 &&
      (!userId ||
        account.accountMembers.some((member) => member.userId === userId)),
  );
  const accounts = eligibleAccounts.filter(
    (account) => !requestedAccountId || account.id === requestedAccountId,
  );

  if (accounts.length !== 1) {
    const options = eligibleAccounts.map(
      (account) => `${account.name} (${account.id})`,
    );
    throw new Error(
      options.length
        ? `Informe SEED_TEST_ACCOUNT_ID. Contas elegíveis: ${options.join(', ')}`
        : 'Nenhuma conta ativa com membros foi encontrada neste tenant.',
    );
  }

  const account = accounts[0];
  const members = account.accountMembers.filter(
    (member) => !userId || member.userId === userId,
  );
  const member =
    members.find((candidate) => candidate.role === 'OWNER') ??
    (members.length === 1 ? members[0] : undefined);

  if (!member) {
    throw new Error(
      `Informe SEED_TEST_USER_ID ou SEED_TEST_USER_EMAIL. Membros elegíveis: ${members.map((candidate) => `${candidate.userId} (${candidate.role})`).join(', ') || 'nenhum'}`,
    );
  }

  const incomeCategory = tenant.categories.find(
    (category) => category.type === 'INCOME',
  );
  const expenseCategory = tenant.categories.find(
    (category) => category.type === 'EXPENSE',
  );

  if (!incomeCategory || !expenseCategory) {
    throw new Error('Categorias de receita e despesa não encontradas.');
  }

  const createTransaction = new CreateTransactionUseCase(prisma);
  const now = new Date();
  let created = 0;
  let skipped = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const monthOffset = samples.length - index - 1;
    const monthDate = new Date(
      now.getFullYear(),
      now.getMonth() - monthOffset,
      1,
    );
    const day = monthOffset === 0 ? Math.max(1, now.getDate() - 1) : 15;
    const date = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      day,
      12,
    );
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    for (const item of [
      {
        type: TransactionType.INCOME,
        categoryId: incomeCategory.id,
        title: `[Teste Dashboard] Receita ${monthKey}`,
        amount: samples[index].income,
      },
      {
        type: TransactionType.EXPENSE,
        categoryId: expenseCategory.id,
        title: `[Teste Dashboard] Despesa ${monthKey}`,
        amount: samples[index].expense,
      },
    ]) {
      const existing = await prisma.transaction.findFirst({
        where: { tenantId: tenant.id, title: item.title, deletedAt: null },
        select: { id: true },
      });

      if (existing) {
        skipped += 1;
        continue;
      }

      await createTransaction.execute({
        tenantId: tenant.id,
        userId: member.userId,
        accountId: account.id,
        categoryId: item.categoryId,
        title: item.title,
        amount: item.amount,
        type: item.type,
        date: date.toISOString(),
        description:
          'Lançamento demonstrativo para validar os indicadores do dashboard.',
      });
      created += 1;
    }
  }

  console.log(
    `Seed do dashboard concluído: ${created} lançamentos criados e ${skipped} já existentes ignorados.`,
  );
  console.log(`Tenant: ${tenant.name}; conta: ${account.name}.`);
}

seedDashboardTestData()
  .catch((error: unknown) => {
    console.error('Falha ao criar lançamentos de teste:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.onModuleDestroy();
  });
