import { ForbiddenException } from '@nestjs/common';
import { TenantRole } from '../../../tenant/domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../tenant/domain/repositories/tenant-member.repository';
import { CreateSubscriptionUseCase } from './create-subscription.use-case';

describe('CreateSubscriptionUseCase - autorização multi-tenant', () => {
  const tenantId = 'tenant-a';
  const userId = 'user-a';

  let useCase: CreateSubscriptionUseCase;
  let tenantMemberRepository: {
    findByTenantAndUser: jest.Mock;
  };

  const input = {
    tenantId,
    userId,
    planCode: 'BASIC',
    planPriceId: 'price-a',
    billingDay: 10,
    installmentCount: 1,
  };

  beforeEach(() => {
    tenantMemberRepository = {
      findByTenantAndUser: jest.fn(),
    };

    useCase = new CreateSubscriptionUseCase(
      tenantMemberRepository as unknown as TenantMemberRepository,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  });

  it('deve rejeitar usuário sem vínculo com o Tenant', async () => {
    tenantMemberRepository.findByTenantAndUser.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(
      tenantMemberRepository.findByTenantAndUser,
    ).toHaveBeenCalledWith(tenantId, userId);
  });

  it('deve rejeitar membro que não seja OWNER', async () => {
    tenantMemberRepository.findByTenantAndUser.mockResolvedValue({
      tenantId,
      userId,
      role: 'MEMBER',
      status: 'ACTIVE',
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(
      tenantMemberRepository.findByTenantAndUser,
    ).toHaveBeenCalledWith(tenantId, userId);
  });

  it('deve rejeitar membro ADMIN que não seja OWNER', async () => {
    tenantMemberRepository.findByTenantAndUser.mockResolvedValue({
      tenantId,
      userId,
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('deve consultar o vínculo usando exatamente o Tenant e usuário recebidos', async () => {
    tenantMemberRepository.findByTenantAndUser.mockResolvedValue(null);

    await expect(
      useCase.execute({
        ...input,
        tenantId: 'tenant-b',
        userId: 'user-b',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(
      tenantMemberRepository.findByTenantAndUser,
    ).toHaveBeenCalledWith('tenant-b', 'user-b');
  });

  it('deve permitir que OWNER avance para a validação do plano', async () => {
    tenantMemberRepository.findByTenantAndUser.mockResolvedValue({
      tenantId,
      userId,
      role: TenantRole.OWNER,
      status: 'ACTIVE',
    });

    const reachedPlanValidation = new Error('PLAN_VALIDATION_REACHED');

    const planRepository = new Proxy(
      {},
      {
        get: () => jest.fn(() => Promise.reject(reachedPlanValidation)),
      },
    );

    useCase = new CreateSubscriptionUseCase(
      tenantMemberRepository as unknown as TenantMemberRepository,
      planRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );

    await expect(useCase.execute(input)).rejects.toBe(
      reachedPlanValidation,
    );
  });
});
