import {
  PrismaClient,
  TenantRole,
  TenantMemberStatus,
  SubscriptionStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'paulo@test.com';

  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    throw new Error(
      `Administrador ${adminEmail} não encontrado. Verifique o seed principal.`,
    );
  }

  const plan = await prisma.plan.findUnique({
    where: { code: 'SYSTEM_OWNER' },
  });

  if (!plan) {
    throw new Error(
      'Plano SYSTEM_OWNER não encontrado. Verifique o seed principal.',
    );
  }

  // Garante a conta de cobrança do proprietário.
  const billingAccount = await prisma.billingAccount.upsert({
    where: { ownerUserId: admin.id },
    update: { name: 'CCPF - Sistema' },
    create: {
      name: 'CCPF - Sistema',
      ownerUserId: admin.id,
    },
  });

  // Cria ou reutiliza o Tenant inicial do administrador.
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'ccpf-system-owner' },
    update: {
      name: 'CCPF - Sistema',
      status: 'ACTIVE',
      billingAccountId: billingAccount.id,
    },
    create: {
      name: 'CCPF - Sistema',
      slug: 'ccpf-system-owner',
      status: 'ACTIVE',
      billingAccountId: billingAccount.id,
    },
  });

  // Vincula o administrador ao Tenant como OWNER.
  await prisma.tenantMember.upsert({
    where: {
      tenantId_userId: {
        tenantId: tenant.id,
        userId: admin.id,
      },
    },
    update: {
      role: TenantRole.OWNER,
      status: TenantMemberStatus.ACTIVE,
    },
    create: {
      tenantId: tenant.id,
      userId: admin.id,
      role: TenantRole.OWNER,
      status: TenantMemberStatus.ACTIVE,
    },
  });

  // Reutiliza a assinatura mais recente ou cria uma nova.
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: tenant.id },
    orderBy: { createdAt: 'desc' },
  });

  const now = new Date();
  const periodEnd = new Date('2099-12-31T23:59:59.000Z');

  const subscriptionData = {
    planId: plan.id,
    billingAccountId: billingAccount.id,
    planPriceId: null,
    pendingPlanId: null,
    pendingPlanPriceId: null,
    pendingPlanChangeType: null,
    pendingPlanEffectiveAt: null,
    pendingPlanInvoiceId: null,
    pendingBillingDay: null,
    status: SubscriptionStatus.ACTIVE,
    startedAt: now,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    billingDay: null,
    nextBillingDate: null,
    trialEndsAt: null,
    cancelledAt: null,
  };

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: subscriptionData,
    });
  } else {
    await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        ...subscriptionData,
      },
    });
  }

  console.log('\n=== SYSTEM_OWNER CONFIGURADO ===');
  console.log(`Administrador: ${admin.email}`);
  console.log(`Tenant: ${tenant.name}`);
  console.log(`Tenant ID: ${tenant.id}`);
  console.log(`BillingAccount ID: ${billingAccount.id}`);
  console.log(`Plano: ${plan.code}`);
  console.log('Assinatura: ACTIVE');
}

main()
  .catch((error) => {
    console.error('Falha ao configurar o Tenant SYSTEM_OWNER:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
