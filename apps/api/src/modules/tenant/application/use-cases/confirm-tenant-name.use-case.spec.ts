import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TenantMemberStatus } from '../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../domain/repositories/tenant-member.repository';
import { TenantRepository } from '../../domain/repositories/tenant.repository';
import { ConfirmTenantNameUseCase } from './confirm-tenant-name.use-case';

describe('ConfirmTenantNameUseCase', () => {
  let tenants: { findById: jest.Mock; update: jest.Mock };
  let members: { findByTenantAndUser: jest.Mock };
  let useCase: ConfirmTenantNameUseCase;

  const tenant = {
    id: 'tenant-123',
    name: 'Nome antigo',
    nameConfirmed: false,
    updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  };

  beforeEach(() => {
    tenants = {
      findById: jest.fn().mockResolvedValue({ ...tenant }),
      update: jest.fn().mockResolvedValue(undefined),
    };

    members = {
      findByTenantAndUser: jest.fn().mockResolvedValue({
        tenantId: 'tenant-123',
        userId: 'owner-123',
        role: TenantRole.OWNER,
        status: TenantMemberStatus.ACTIVE,
      }),
    };

    useCase = new ConfirmTenantNameUseCase(
      tenants as unknown as TenantRepository,
      members as unknown as TenantMemberRepository,
    );
  });

  const input = {
    tenantId: 'tenant-123',
    userId: 'owner-123',
    name: ' Empresa nova ',
  };

  it('confirma o nome para o OWNER ativo do Tenant', async () => {
    await useCase.execute(input);

    expect(members.findByTenantAndUser).toHaveBeenCalledWith(
      'tenant-123',
      'owner-123',
    );
    expect(tenants.findById).toHaveBeenCalledWith('tenant-123');
    expect(tenants.update).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Empresa nova',
        nameConfirmed: true,
      }),
    );
  });

  it('bloqueia usuário sem associação', async () => {
    members.findByTenantAndUser.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(tenants.findById).not.toHaveBeenCalled();
    expect(tenants.update).not.toHaveBeenCalled();
  });

  it('bloqueia MEMBER ativo', async () => {
    members.findByTenantAndUser.mockResolvedValue({
      tenantId: 'tenant-123',
      userId: 'owner-123',
      role: TenantRole.MEMBER,
      status: TenantMemberStatus.ACTIVE,
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(tenants.update).not.toHaveBeenCalled();
  });

  it('bloqueia OWNER que não esteja ativo', async () => {
    members.findByTenantAndUser.mockResolvedValue({
      tenantId: 'tenant-123',
      userId: 'owner-123',
      role: TenantRole.OWNER,
      status: TenantMemberStatus.BLOCKED,
    });

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(tenants.update).not.toHaveBeenCalled();
  });

  it('rejeita nome fora do tamanho permitido', async () => {
    await expect(
      useCase.execute({ ...input, name: ' A ' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tenants.update).not.toHaveBeenCalled();
  });

  it('retorna não encontrado se o Tenant não existir', async () => {
    tenants.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(tenants.update).not.toHaveBeenCalled();
  });
});
