import { ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../../../infrastructure/database/prisma.service';
import { EmailVerificationNotifierContract } from '../../../../identity/domain/contracts/email-verification-notifier.contract';
import { PasswordHasherContract } from '../../../../identity/domain/contracts/password-hasher.contract';
import { TenantPlanLimitsRepository } from '../../../domain/repositories/tenant-plan-limits.repository';
import { CreateTenantMemberUserUseCase } from './create-tenant-member-user.use-case';

describe('CreateTenantMemberUserUseCase', () => {
  const createdUser = {
    id: 'user-123',
    name: 'Novo usuário',
    email: 'novo@example.com',
  };

  let prisma: {
    user: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    user: { create: jest.Mock };
    tenantMember: { count: jest.Mock; create: jest.Mock };
  };
  let planLimits: { findMaxUsersByTenant: jest.Mock };
  let passwordHasher: { hash: jest.Mock };
  let notifier: { sendVerificationEmail: jest.Mock };
  let useCase: CreateTenantMemberUserUseCase;

  beforeEach(() => {
    tx = {
      user: {
        create: jest.fn().mockResolvedValue(createdUser),
      },
      tenantMember: {
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue({}),
      },
    };

    prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
      $transaction: jest.fn(
        async (callback: (transaction: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };

    planLimits = {
      findMaxUsersByTenant: jest.fn().mockResolvedValue(3),
    };

    passwordHasher = {
      hash: jest.fn().mockResolvedValue('hashed-password'),
    };

    notifier = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    useCase = new CreateTenantMemberUserUseCase(
      prisma as unknown as PrismaService,
      planLimits as unknown as TenantPlanLimitsRepository,
      passwordHasher as unknown as PasswordHasherContract,
      notifier as unknown as EmailVerificationNotifierContract,
    );
  });

  const input = {
    tenantId: 'tenant-123',
    name: ' Novo usuário ',
    email: ' NOVO@EXAMPLE.COM ',
    password: 'StrongPassword123!',
    role: 'MEMBER' as const,
  };

  it('cria o usuário e o vínculo TENANT_CREATED na mesma transação serializável', async () => {
    const result = await useCase.execute(input);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'novo@example.com' },
      select: { id: true },
    });

    expect(prisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    expect(tx.tenantMember.count).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-123',
        status: { not: 'REMOVED' },
      },
    });

    expect(tx.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Novo usuário',
          email: 'novo@example.com',
          password: 'hashed-password',
        }),
      }),
    );

    expect(tx.tenantMember.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-123',
        userId: createdUser.id,
        role: 'MEMBER',
        status: 'ACTIVE',
        origin: 'TENANT_CREATED',
      },
    });

    expect(result).toEqual({
      ...createdUser,
      role: 'MEMBER',
      origin: 'TENANT_CREATED',
    });

    expect(notifier.sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: createdUser.email,
        name: createdUser.name,
      }),
    );
  });

  it('bloqueia a criação quando o limite do plano já foi atingido', async () => {
    tx.tenantMember.count.mockResolvedValue(3);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(tx.user.create).not.toHaveBeenCalled();
    expect(tx.tenantMember.create).not.toHaveBeenCalled();
    expect(notifier.sendVerificationEmail).not.toHaveBeenCalled();
  });

  it('permite a criação quando o plano não possui limite de usuários (-1)', async () => {
    planLimits.findMaxUsersByTenant.mockResolvedValue(-1);

    const result = await useCase.execute(input);

    expect(tx.tenantMember.count).not.toHaveBeenCalled();
    expect(tx.tenantMember.create).toHaveBeenCalledWith({
      data: {
        tenantId: 'tenant-123',
        userId: createdUser.id,
        role: 'MEMBER',
        status: 'ACTIVE',
        origin: 'TENANT_CREATED',
      },
    });
    expect(result.origin).toBe('TENANT_CREATED');
  });

  it('não permite criar usuário quando o Tenant não possui assinatura elegível', async () => {
    planLimits.findMaxUsersByTenant.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(tx.user.create).not.toHaveBeenCalled();
  });
});
