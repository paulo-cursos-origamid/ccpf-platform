import { PrismaClient, PlanFeatureCode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed inicial da plataforma CCPF.
 *
 * Responsabilidades:
 * - Criar as permissões globais da plataforma.
 * - Criar as roles globais.
 * - Associar permissões às roles.
 * - Criar o usuário administrativo inicial.
 * - Associar o usuário à role PLATFORM_ADMIN.
 * - Criar os planos comerciais.
 * - Criar as features comerciais de cada plano.
 *
 * O seed utiliza upsert para entidades principais e pode ser
 * executado várias vezes sem duplicar registros.
 */

const permissions = [
  [
    'USERS_READ',
    'Consultar usuários',
    'Permite consultar usuários da plataforma.',
  ],
  [
    'USERS_CREATE',
    'Criar usuários',
    'Permite criar usuários da plataforma.',
  ],
  [
    'USERS_UPDATE',
    'Atualizar usuários',
    'Permite atualizar usuários da plataforma.',
  ],
  [
    'USERS_DELETE',
    'Excluir usuários',
    'Permite excluir usuários da plataforma.',
  ],
  [
    'TENANTS_READ',
    'Consultar Tenants',
    'Permite consultar Tenants da plataforma.',
  ],
  [
    'TENANTS_CREATE',
    'Criar Tenants',
    'Permite criar Tenants.',
  ],
  [
    'TENANTS_UPDATE',
    'Atualizar Tenants',
    'Permite atualizar Tenants.',
  ],
  [
    'PLANS_READ',
    'Consultar planos',
    'Permite consultar planos comerciais.',
  ],
  [
    'PLANS_CREATE',
    'Criar planos',
    'Permite criar planos comerciais.',
  ],
  [
    'PLANS_UPDATE',
    'Atualizar planos',
    'Permite atualizar planos comerciais.',
  ],
  [
    'SUBSCRIPTIONS_READ',
    'Consultar assinaturas',
    'Permite consultar assinaturas.',
  ],
  [
    'SUBSCRIPTIONS_UPDATE',
    'Atualizar assinaturas',
    'Permite atualizar assinaturas.',
  ],
  [
    'BILLING_READ',
    'Consultar cobrança',
    'Permite consultar informações de cobrança.',
  ],
  [
    'BILLING_MANAGE',
    'Gerenciar cobrança',
    'Permite administrar cobranças.',
  ],
] as const;

const roles = [
  {
    code: 'PLATFORM_ADMIN',
    name: 'Administrador da Plataforma',
    description: 'Acesso administrativo completo à plataforma CCPF.',
    permissions: permissions.map(([code]) => code),
  },
  {
    code: 'PLATFORM_MANAGER',
    name: 'Gerente da Plataforma',
    description: 'Responsável pela gestão operacional da plataforma.',
    permissions: [
      'USERS_READ',
      'USERS_UPDATE',
      'TENANTS_READ',
      'TENANTS_UPDATE',
    ],
  },
  {
    code: 'PLATFORM_SUPPORT',
    name: 'Suporte da Plataforma',
    description: 'Responsável pelo atendimento e suporte aos usuários.',
    permissions: ['USERS_READ', 'TENANTS_READ'],
  },
  {
    code: 'PLATFORM_BILLING',
    name: 'Gestor de Billing',
    description: 'Responsável por planos, assinaturas e cobrança.',
    permissions: [
      'PLANS_READ',
      'PLANS_CREATE',
      'PLANS_UPDATE',
      'SUBSCRIPTIONS_READ',
      'SUBSCRIPTIONS_UPDATE',
      'BILLING_READ',
      'BILLING_MANAGE',
    ],
  },
] as const;

const allFeatures: PlanFeatureCode[] = [
  'DOMESTIC',
  'HEALTH',
  'TRANSPORT',
  'VEHICLES',
  'INVESTMENTS',
  'OTHER',
  'BASIC_REPORTS',
  'ADVANCED_REPORTS',
];

const plans = [
  {
    name: 'Plano Trial',
    code: 'TRIAL',
    description:
      'Período gratuito para conhecer os principais recursos do CCPF.',
    price: '0.00',
    currency: 'BRL',
    billingInterval: 'MONTHLY' as const,
    maxUsers: 2,
    isPublic: true,
    isActive: true,
    features: [
      'DOMESTIC',
      'HEALTH',
      'TRANSPORT',
      'VEHICLES',
      'OTHER',
      'BASIC_REPORTS',
    ] as PlanFeatureCode[],
  },
  {
    name: 'Plano Básico',
    code: 'BASIC',
    description:
      'Plano para controle financeiro pessoal e familiar com os recursos essenciais.',
    price: '19.90',
    currency: 'BRL',
    billingInterval: 'MONTHLY' as const,
    maxUsers: 3,
    isPublic: true,
    isActive: true,
    features: [
      'DOMESTIC',
      'HEALTH',
      'TRANSPORT',
      'VEHICLES',
      'OTHER',
      'BASIC_REPORTS',
    ] as PlanFeatureCode[],
  },
  {
    name: 'Plano Pro',
    code: 'PRO',
    description:
      'Plano para usuários que precisam de maior controle financeiro e recursos avançados.',
    price: '39.90',
    currency: 'BRL',
    billingInterval: 'MONTHLY' as const,
    maxUsers: 5,
    isPublic: true,
    isActive: true,
    features: [
      'DOMESTIC',
      'HEALTH',
      'TRANSPORT',
      'VEHICLES',
      'INVESTMENTS',
      'OTHER',
      'BASIC_REPORTS',
      'ADVANCED_REPORTS',
    ] as PlanFeatureCode[],
  },
  {
    name: 'Plano Premium',
    code: 'PREMIUM',
    description:
      'Plano completo para famílias e grupos que precisam de maior capacidade e recursos avançados.',
    price: '69.90',
    currency: 'BRL',
    billingInterval: 'MONTHLY' as const,
    maxUsers: 10,
    isPublic: true,
    isActive: true,
    features: allFeatures,
  },
  {
    name: 'System Owner',
    code: 'SYSTEM_OWNER',
    description:
      'Plano interno reservado para administração da plataforma CCPF.',
    price: '0.00',
    currency: 'BRL',
    billingInterval: 'MONTHLY' as const,
    maxUsers: -1,
    isPublic: false,
    isActive: true,
    features: allFeatures,
  },
] as const;

async function seedPermissions() {
  console.log('Criando permissões da plataforma...');

  for (const [code, name, description] of permissions) {
    await prisma.platformPermission.upsert({
      where: { code },
      update: {
        name,
        description,
      },
      create: {
        code,
        name,
        description,
      },
    });
  }
}

async function seedRoles() {
  console.log('Criando roles da plataforma...');

  for (const roleDefinition of roles) {
    const role = await prisma.platformRole.upsert({
      where: {
        code: roleDefinition.code,
      },
      update: {
        name: roleDefinition.name,
        description: roleDefinition.description,
        isSystem: true,
        isActive: true,
      },
      create: {
        code: roleDefinition.code,
        name: roleDefinition.name,
        description: roleDefinition.description,
        isSystem: true,
        isActive: true,
      },
    });

    for (const permissionCode of roleDefinition.permissions) {
      const permission = await prisma.platformPermission.findUnique({
        where: {
          code: permissionCode,
        },
      });

      if (!permission) {
        throw new Error(
          `Permissão não encontrada durante o seed: ${permissionCode}`,
        );
      }

      await prisma.platformRolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }
}

async function seedAdminUser() {
  console.log('Criando usuário administrativo inicial...');

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'paulo@test.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'senha123';

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: {
      email: adminEmail,
    },
    update: {
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
      deletedAt: null,
      password: passwordHash,
    },
    create: {
      name: 'Paulo',
      email: adminEmail,
      password: passwordHash,
      role: 'ADMIN',
      emailVerified: true,
      isActive: true,
    },
  });

  const platformAdminRole = await prisma.platformRole.findUnique({
    where: {
      code: 'PLATFORM_ADMIN',
    },
  });

  if (!platformAdminRole) {
    throw new Error('Role PLATFORM_ADMIN não encontrada.');
  }

  await prisma.userPlatformRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: platformAdminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: platformAdminRole.id,
    },
  });

  console.log(`Administrador configurado: ${adminEmail}`);
}

async function seedPlans() {
  console.log('Criando planos comerciais...');

  for (const planDefinition of plans) {
    const plan = await prisma.plan.upsert({
      where: {
        code: planDefinition.code,
      },
      update: {
        name: planDefinition.name,
        description: planDefinition.description,
        price: planDefinition.price,
        currency: planDefinition.currency,
        billingInterval: planDefinition.billingInterval,
        maxUsers: planDefinition.maxUsers,
        isPublic: planDefinition.isPublic,
        isActive: planDefinition.isActive,
      },
      create: {
        name: planDefinition.name,
        code: planDefinition.code,
        description: planDefinition.description,
        price: planDefinition.price,
        currency: planDefinition.currency,
        billingInterval: planDefinition.billingInterval,
        maxUsers: planDefinition.maxUsers,
        isPublic: planDefinition.isPublic,
        isActive: planDefinition.isActive,
      },
    });

    await prisma.planFeature.deleteMany({
      where: {
        planId: plan.id,
      },
    });

    await prisma.planFeature.createMany({
      data: planDefinition.features.map((feature) => ({
        planId: plan.id,
        feature,
        enabled: true,
      })),
    });
  }
}

async function main() {
  console.log('========================================');
  console.log('CCPF — Seed inicial da plataforma');
  console.log('========================================');

  await seedPermissions();
  await seedRoles();
  await seedAdminUser();
  await seedPlans();

  console.log('========================================');
  console.log('Seed concluído com sucesso.');
  console.log('========================================');
}

main()
  .catch((error) => {
    console.error('Erro durante o seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
