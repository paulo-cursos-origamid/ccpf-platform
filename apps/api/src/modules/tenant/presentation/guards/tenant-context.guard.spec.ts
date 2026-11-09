import {
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';

import { TenantEntity } from '../../domain/entities/tenant.entity';
import { TenantMemberEntity } from '../../domain/entities/tenant-member.entity';
import { TenantMemberStatus } from '../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../domain/enums/tenant-role.enum';
import { TenantStatus } from '../../domain/enums/tenant-status.enum';
import { TenantMemberRepository } from '../../domain/repositories/tenant-member.repository';
import { TenantRepository } from '../../domain/repositories/tenant.repository';
import { TenantContext } from '../interfaces/tenant-context.interface';
import { TenantContextGuard } from './tenant-context.guard';

type RequestMock = {
  user?: { sub: string };
  headers: Record<string, string>;
  tenantContext?: TenantContext;
};

function createExecutionContext(request: RequestMock): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('TenantContextGuard', () => {
  const tenantRepository = {
    findById: jest.fn(),
  } as unknown as jest.Mocked<TenantRepository>;

  const memberRepository = {
    findByTenantAndUser: jest.fn(),
  } as unknown as jest.Mocked<TenantMemberRepository>;

  const guard = new TenantContextGuard(
    tenantRepository,
    memberRepository,
  );

  const makeTenant = (status = TenantStatus.ACTIVE) =>
    ({
      id: 'tenant-1',
      status,
    }) as unknown as TenantEntity;

  const makeMember = (status = TenantMemberStatus.ACTIVE) =>
    ({
      id: 'member-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      role: TenantRole.OWNER,
      status,
      origin: undefined,
    }) as unknown as TenantMemberEntity;

  const makeRequest = (): RequestMock => ({
    user: { sub: 'user-1' },
    headers: { 'x-tenant-id': 'tenant-1' },
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejeita requisição sem usuário autenticado', async () => {
    const request: RequestMock = {
      headers: { 'x-tenant-id': 'tenant-1' },
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(UnauthorizedException);

    expect(tenantRepository.findById).not.toHaveBeenCalled();
    expect(memberRepository.findByTenantAndUser).not.toHaveBeenCalled();
  });

  it('rejeita requisição sem X-Tenant-Id', async () => {
    const request: RequestMock = {
      user: { sub: 'user-1' },
      headers: {},
    };

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(ForbiddenException);

    expect(tenantRepository.findById).not.toHaveBeenCalled();
  });

  it('rejeita Tenant inexistente', async () => {
    const request = makeRequest();
    tenantRepository.findById.mockResolvedValue(null);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(ForbiddenException);

    expect(tenantRepository.findById).toHaveBeenCalledWith('tenant-1');
    expect(memberRepository.findByTenantAndUser).not.toHaveBeenCalled();
  });

  it('rejeita Tenant inativo', async () => {
    const request = makeRequest();
    tenantRepository.findById.mockResolvedValue(
      makeTenant('INACTIVE' as TenantStatus),
    );

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(ForbiddenException);

    expect(memberRepository.findByTenantAndUser).not.toHaveBeenCalled();
  });

  it('rejeita usuário sem vínculo com o Tenant', async () => {
    const request = makeRequest();
    tenantRepository.findById.mockResolvedValue(makeTenant());
    memberRepository.findByTenantAndUser.mockResolvedValue(null);

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(ForbiddenException);

    expect(memberRepository.findByTenantAndUser).toHaveBeenCalledWith(
      'tenant-1',
      'user-1',
    );
    expect(request.tenantContext).toBeUndefined();
  });

  it.each([
    TenantMemberStatus.INVITED,
    TenantMemberStatus.BLOCKED,
    TenantMemberStatus.REMOVED,
  ])('rejeita membro com vínculo %s', async (status) => {
    const request = makeRequest();
    tenantRepository.findById.mockResolvedValue(makeTenant());
    memberRepository.findByTenantAndUser.mockResolvedValue(
      makeMember(status),
    );

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).rejects.toThrow(ForbiddenException);

    expect(memberRepository.findByTenantAndUser).toHaveBeenCalledWith(
      'tenant-1',
      'user-1',
    );
    expect(request.tenantContext).toBeUndefined();
  });

  it('cria o contexto para Tenant e membro ativos', async () => {
    const request = makeRequest();
    tenantRepository.findById.mockResolvedValue(makeTenant());
    memberRepository.findByTenantAndUser.mockResolvedValue(makeMember());

    await expect(
      guard.canActivate(createExecutionContext(request)),
    ).resolves.toBe(true);

    expect(request.tenantContext).toEqual({
      tenantId: 'tenant-1',
      userId: 'user-1',
      role: TenantRole.OWNER,
      origin: undefined,
    });
  });
});
