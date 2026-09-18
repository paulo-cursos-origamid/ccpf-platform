import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed inicial da autorização global da plataforma CCPF.
 *
 * Responsabilidades:
 * - Criar as permissões globais da plataforma.
 * - Criar os papéis globais.
 * - Associar permissões aos papéis.
 * - Associar o administrador principal ao PLATFORM_ADMIN.
 *
 * O seed utiliza upsert para poder ser executado várias vezes
 * sem criar registros duplicados.
 */

const permissions = [
  ['USERS_READ', 'Consultar usuários', 'Permite consultar usuários da plataforma.'],
  ['USERS_CREATE', 'Criar usuários', 'Permite criar usuários da plataforma.'],
  ['USERS_UPDATE', 'Atualizar usuários', 'Permite atualizar usuários da plataforma.'],
  ['USERS_DELETE', 'Excluir usuários', 'Permite excluir usuários da plataforma.'],

  ['TENANTS_READ', 'Consultar Tenants', 'Permite consultar Tenants da plataforma.'],
  ['TENANTS_CREATE', 'Criar Tenants', 'Permite criar Tenants.'],
  ['TENANTS_UPDATE', 'Atualizar Tenants', 'Permite atualizar Tenants.'],

  ['PLANS_READ', 'Consultar planos', 'Permite consultar planos comerciais.'],
  ['PLANS_CREATE', 'Criar planos', 'Permite criar planos comerciais.'],
  ['PLANS_UPDATE', 'Atualizar planos', 'Permite atualizar planos comerciais.'],

  ['SUBSCRIPTIONS_READ', 'Consultar assinaturas', 'Permite consultar assinaturas.'],
  ['SUBSCRIPTIONS_UPDATE', 'Atualizar assinaturas', 'Permite atualizar assinaturas.'],

  ['BILLING_READ', 'Consultar cobrança', 'Permite consultar informações de cobrança.'],
  ['BILLING_MANAGE', 'Gerenciar cobrança', 'Permite administrar cobranças.'],
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
    permissions: [
      'USERS_READ',
      'TENANTS_READ',
    ],
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

async function main() {
  console.log('Iniciando seed de autorização da plataforma...');

  // Cria ou atualiza todas as permissões globais.
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

  // Cria os papéis globais e suas respectivas permissões.
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

    // Garante que todas as permissões do papel estejam associadas.
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

  // Associa o usuário administrativo atual ao papel global PLATFORM_ADMIN.
  const adminUser = await prisma.user.findUnique({
    where: {
      email: 'paulo@test.com',
    },
  });

  if (!adminUser) {
    throw new Error(
      'Usuário administrativo paulo@test.com não encontrado.',
    );
  }

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

  console.log('Seed de autorização concluído.');
}

main()
  .catch((error) => {
    console.error('Erro durante o seed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
