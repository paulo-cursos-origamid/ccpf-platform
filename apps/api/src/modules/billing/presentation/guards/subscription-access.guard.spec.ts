import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import { SubscriptionEntity } from '../../domain/entities/subscription.entity';
import { SubscriptionLifecycleService } from '../../application/services/subscription-lifecycle.service';
import { TenantContext } from '../../../tenant/presentation/interfaces/tenant-context.interface';
import { SubscriptionAccessGuard } from './subscription-access.guard';

type RequestMock = {
  tenantContext?: TenantContext;
};

function createExecutionContext(request: RequestMock): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('SubscriptionAccessGuard', () => {
  const lifecycleService = {
    resolveCurrent: jest.fn(),
  } as unknown as jest.Mocked<SubscriptionLifecycleService>;

  const guard = new SubscriptionAccessGuard(lifecycleService);

  const tenantContext = {
    tenantId: 'tenant-1',
    userId: 'user-1',
    role: 'OWNER',
    origin: undefined,
  } as unknown as TenantContext;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejeita requisição sem contexto do Tenant', async () => {
    const request: RequestMock = {};

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(ForbiddenException);

    expect(lifecycleService.resolveCurrent).not.toHaveBeenCalled();
  });

  it('rejeita Tenant sem assinatura comercial', async () => {
    const request: RequestMock = { tenantContext };

    lifecycleService.resolveCurrent.mockResolvedValue(null);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(ForbiddenException);

    expect(lifecycleService.resolveCurrent).toHaveBeenCalledWith('tenant-1');
  });

  it('rejeita assinatura sem acesso comercial', async () => {
    const request: RequestMock = { tenantContext };

    lifecycleService.resolveCurrent.mockResolvedValue({
      hasCommercialAccess: false,
    } as unknown as SubscriptionEntity);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(ForbiddenException);

    expect(lifecycleService.resolveCurrent).toHaveBeenCalledWith('tenant-1');
  });

  it('permite acesso quando a assinatura possui acesso comercial', async () => {
    const request: RequestMock = { tenantContext };

    lifecycleService.resolveCurrent.mockResolvedValue({
      hasCommercialAccess: true,
    } as unknown as SubscriptionEntity);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);

    expect(lifecycleService.resolveCurrent).toHaveBeenCalledWith('tenant-1');
  });
});
