import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';

import { CreateTenantUseCase } from './create-tenant.use-case';
import { TenantPlanLimitsRepository } from '../../../domain/repositories/tenant-plan-limits.repository';
import { TenantRepository } from '../../../domain/repositories/tenant.repository';
import { TenantProvisioningRepository } from '../../../domain/repositories/tenant-provisioning.repository';
import { CreateNotificationsForPermissionUseCase } from '../../../../notifications/application/use-cases/create-notifications-for-permission.use-case';

describe('CreateTenantUseCase', () => {
  let useCase: CreateTenantUseCase;

  const tenantRepository = {
    findBySlug: jest.fn(),
  };

  const tenantPlanLimitsRepository = {
    findMaxTenantsByUser: jest.fn(),
    countOwnedTenantsByUser: jest.fn(),
  };

  const tenantProvisioningRepository = {
    createWithOwner: jest.fn(),
  };

  const createNotificationsForPermissionUseCase = {
    execute: jest.fn().mockResolvedValue(undefined),
  };

  const input = {
    name: ' Empresa Nova ',
    slug: ' EMPRESA-NOVA ',
    ownerUserId: 'user-1',
  };

  const createdTenant = {
    tenant: {
      id: 'tenant-new',
      name: 'Empresa Nova',
      slug: 'empresa-nova',
    },
    owner: {
      tenantId: 'tenant-new',
      userId: 'user-1',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    tenantPlanLimitsRepository.findMaxTenantsByUser.mockResolvedValue(1);
    tenantPlanLimitsRepository.countOwnedTenantsByUser.mockResolvedValue(0);
    tenantRepository.findBySlug.mockResolvedValue(null);
    tenantProvisioningRepository.createWithOwner.mockResolvedValue(createdTenant);

    useCase = new CreateTenantUseCase(
      tenantRepository as unknown as TenantRepository,
      tenantPlanLimitsRepository as unknown as TenantPlanLimitsRepository,
      tenantProvisioningRepository as unknown as TenantProvisioningRepository,
      createNotificationsForPermissionUseCase as unknown as CreateNotificationsForPermissionUseCase,
    );
  });

  it('deve criar um Tenant quando existe capacidade no plano', async () => {
    const result = await useCase.execute(input);

    expect(result).toBe(createdTenant);
    expect(tenantPlanLimitsRepository.findMaxTenantsByUser)
      .toHaveBeenCalledWith('user-1');
    expect(tenantPlanLimitsRepository.countOwnedTenantsByUser)
      .toHaveBeenCalledWith('user-1');
    expect(tenantProvisioningRepository.createWithOwner).toHaveBeenCalledTimes(1);
  });

  it('deve bloquear a criação quando o limite do plano foi atingido', async () => {
    tenantPlanLimitsRepository.findMaxTenantsByUser.mockResolvedValue(1);
    tenantPlanLimitsRepository.countOwnedTenantsByUser.mockResolvedValue(1);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ForbiddenException);

    expect(tenantRepository.findBySlug).not.toHaveBeenCalled();
    expect(tenantProvisioningRepository.createWithOwner).not.toHaveBeenCalled();
  });

  it('deve permitir criar Tenant no plano ilimitado (-1)', async () => {
    tenantPlanLimitsRepository.findMaxTenantsByUser.mockResolvedValue(-1);
    tenantPlanLimitsRepository.countOwnedTenantsByUser.mockResolvedValue(100);

    await expect(useCase.execute(input)).resolves.toBe(createdTenant);

    expect(tenantPlanLimitsRepository.countOwnedTenantsByUser).not.toHaveBeenCalled();
    expect(tenantProvisioningRepository.createWithOwner).toHaveBeenCalledTimes(1);
  });

  it('deve bloquear a criação quando não há assinatura elegível', async () => {
    tenantPlanLimitsRepository.findMaxTenantsByUser.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ForbiddenException);

    expect(tenantPlanLimitsRepository.countOwnedTenantsByUser).not.toHaveBeenCalled();
    expect(tenantProvisioningRepository.createWithOwner).not.toHaveBeenCalled();
  });

  it('deve rejeitar nome vazio', async () => {
    await expect(useCase.execute({ ...input, name: '   ' }))
      .rejects.toBeInstanceOf(BadRequestException);

    expect(tenantPlanLimitsRepository.findMaxTenantsByUser).not.toHaveBeenCalled();
  });

  it('deve rejeitar slug já utilizado', async () => {
    tenantRepository.findBySlug.mockResolvedValue({ id: 'tenant-existing' });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(ConflictException);

    expect(tenantProvisioningRepository.createWithOwner).not.toHaveBeenCalled();
  });
});
