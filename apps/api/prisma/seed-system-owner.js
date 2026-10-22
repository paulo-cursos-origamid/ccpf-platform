"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const adminEmail = 'paulo@test.com';
    const admin = await prisma.user.findUnique({
        where: { email: adminEmail },
    });
    if (!admin) {
        throw new Error(`Administrador ${adminEmail} não encontrado. Verifique o seed principal.`);
    }
    const plan = await prisma.plan.findUnique({
        where: { code: 'SYSTEM_OWNER' },
    });
    if (!plan) {
        throw new Error('Plano SYSTEM_OWNER não encontrado. Verifique o seed principal.');
    }
    const tenant = await prisma.tenant.upsert({
        where: { slug: 'ccpf-system-owner' },
        update: {
            name: 'CCPF - Sistema',
            status: 'ACTIVE',
        },
        create: {
            name: 'CCPF - Sistema',
            slug: 'ccpf-system-owner',
            status: 'ACTIVE',
        },
    });
    await prisma.tenantMember.upsert({
        where: {
            tenantId_userId: {
                tenantId: tenant.id,
                userId: admin.id,
            },
        },
        update: {
            role: client_1.TenantRole.OWNER,
            status: client_1.TenantMemberStatus.ACTIVE,
        },
        create: {
            tenantId: tenant.id,
            userId: admin.id,
            role: client_1.TenantRole.OWNER,
            status: client_1.TenantMemberStatus.ACTIVE,
        },
    });
    const subscription = await prisma.subscription.findFirst({
        where: { tenantId: tenant.id },
        orderBy: { createdAt: 'desc' },
    });
    const now = new Date();
    const periodEnd = new Date('2099-12-31T23:59:59.000Z');
    const subscriptionData = {
        planId: plan.id,
        planPriceId: null,
        pendingPlanId: null,
        pendingPlanPriceId: null,
        pendingPlanChangeType: null,
        pendingPlanEffectiveAt: null,
        pendingPlanInvoiceId: null,
        pendingBillingDay: null,
        status: client_1.SubscriptionStatus.ACTIVE,
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
    }
    else {
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
//# sourceMappingURL=seed-system-owner.js.map