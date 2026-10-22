import { ConflictException, ForbiddenException } from '@nestjs/common';
import { TenantMemberEntity } from '../../../domain/entities/tenant-member.entity';
import { TenantMemberOrigin } from '../../../domain/enums/tenant-member-origin.enum';
import { TenantMemberStatus } from '../../../domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../../domain/enums/tenant-role.enum';
import { TenantMemberRepository } from '../../../domain/repositories/tenant-member.repository';
import { TenantPlanLimitsRepository } from '../../../domain/repositories/tenant-plan-limits.repository';
import { UserRepository } from '../../../../identity/domain/repositories/user.repository';
import { AddTenantMemberUseCase } from './add-tenant-member.use-case';

describe('AddTenantMemberUseCase', () => {
  const tenantId = 'tenant-current';
  const adminId = 'admin-user';
  const targetId = 'existing-user';

  let repository: {
    findByTenantAndUser: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    countByTenant: jest.Mock;
  };
  let plans: { findMaxUsersByTenant: jest.Mock };
  let users: { findById: jest.Mock };
  let useCase: AddTenantMemberUseCase;
  let admin: TenantMemberEntity;

  const makeMember = (
    userId: string,
    status = TenantMemberStatus.ACTIVE,
  ) => new TenantMemberEntity({
    tenantId,
    userId,
    role: userId === adminId ? TenantRole.ADMIN : TenantRole.MEMBER,
    status,
    origin: TenantMemberOrigin.EXISTING_USER,
  });

  beforeEach(() => {
    admin = makeMember(adminId);
    repository = {
      findByTenantAndUser: jest.fn(async (_tenantId: string, userId: string) =>
        userId === adminId ? admin : null),
      create: jest.fn(async (member: TenantMemberEntity) => member),
      update: jest.fn(async (member: TenantMemberEntity) => member),
      countByTenant: jest.fn().mockResolvedValue(1),
    };
    plans = { findMaxUsersByTenant: jest.fn().mockResolvedValue(5) };
    users = {
      findById: jest.fn().mockResolvedValue({ id: targetId, isActive: true }),
    };
    useCase = new AddTenantMemberUseCase(
      repository as unknown as TenantMemberRepository,
      plans as unknown as TenantPlanLimitsRepository,
      users as unknown as UserRepository,
    );
  });

  const execute = () => useCase.execute({
    tenantId,
    userId: adminId,
    memberUserId: targetId,
    role: TenantRole.MEMBER,
  });

  it('adiciona usuário existente ao Tenant atual', async () => {
    await execute();

    expect(repository.create).toHaveBeenCalledTimes(1);
    const created = repository.create.mock.calls[0][0] as TenantMemberEntity;
    expect(created.tenantId).toBe(tenantId);
    expect(created.userId).toBe(targetId);
    expect(created.origin).toBe(TenantMemberOrigin.EXISTING_USER);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('reativa vínculo REMOVED sem criar duplicata', async () => {
    const removed = makeMember(targetId, TenantMemberStatus.REMOVED);
    repository.findByTenantAndUser.mockImplementation(
      async (_tenantId: string, userId: string) =>
        userId === adminId ? admin : removed,
    );

    await execute();

    expect(repository.update).toHaveBeenCalledWith(removed);
    expect(removed.status).toBe(TenantMemberStatus.ACTIVE);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it.each([
    TenantMemberStatus.ACTIVE,
    TenantMemberStatus.BLOCKED,
    TenantMemberStatus.INVITED,
  ])('não reativa nem duplica vínculo %s', async (status) => {
    const existing = makeMember(targetId, status);
    repository.findByTenantAndUser.mockImplementation(
      async (_tenantId: string, userId: string) =>
        userId === adminId ? admin : existing,
    );

    await expect(execute()).rejects.toBeInstanceOf(ConflictException);
    expect(repository.create).not.toHaveBeenCalled();
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('impede adicionar usuário globalmente inativo', async () => {
    users.findById.mockResolvedValue({ id: targetId, isActive: false });

    await expect(execute()).rejects.toBeInstanceOf(ForbiddenException);
    expect(repository.create).not.toHaveBeenCalled();
  });
});
