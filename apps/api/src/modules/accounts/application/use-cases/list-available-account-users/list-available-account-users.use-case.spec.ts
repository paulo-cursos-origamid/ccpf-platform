import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { AccountMemberEntity } from '../../../domain/entities/account-member.entity';
import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountMemberStatus } from '../../../domain/enums/account-member-status.enum';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { UserRepository } from '../../../../identity/domain/repositories/user.repository';
import { ListAvailableAccountUsersUseCase } from './list-available-account-users.use-case';

describe('ListAvailableAccountUsersUseCase — autorização e isolamento', () => {
  const accountMemberRepository = {
    findByAccountIdAndUserId: jest.fn(),
    findManyByAccountId: jest.fn(),
  } as unknown as jest.Mocked<AccountMemberRepository>;

  const tenantMemberRepository = {
    findByTenant: jest.fn(),
  } as unknown as jest.Mocked<TenantMemberRepository>;

  const userRepository = {
    findById: jest.fn(),
  } as unknown as jest.Mocked<UserRepository>;

  const useCase = new ListAvailableAccountUsersUseCase(
    accountMemberRepository,
    tenantMemberRepository,
    userRepository,
  );

  const input = {
    userId: 'user-owner',
    tenantId: 'tenant-1',
    accountId: 'account-1',
  };

  const member = (
    role: AccountMemberRole,
    status: AccountMemberStatus,
  ) =>
    ({
      id: 'account-member-1',
      accountId: input.accountId,
      userId: input.userId,
      role,
      status,
    }) as AccountMemberEntity;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('consulta o vínculo usando conta, usuário e Tenant informados', async () => {
    accountMemberRepository.findByAccountIdAndUserId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

    expect(accountMemberRepository.findByAccountIdAndUserId).toHaveBeenCalledWith(
      input.accountId,
      input.userId,
      input.tenantId,
    );
    expect(accountMemberRepository.findManyByAccountId).not.toHaveBeenCalled();
    expect(tenantMemberRepository.findByTenant).not.toHaveBeenCalled();
  });

  it('impede membro bloqueado de listar usuários disponíveis', async () => {
    accountMemberRepository.findByAccountIdAndUserId.mockResolvedValue(
      member(AccountMemberRole.OWNER, AccountMemberStatus.BLOCKED),
    );

    await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);

    expect(accountMemberRepository.findManyByAccountId).not.toHaveBeenCalled();
    expect(tenantMemberRepository.findByTenant).not.toHaveBeenCalled();
    expect(userRepository.findById).not.toHaveBeenCalled();
  });

  it('impede MEMBER de listar usuários disponíveis', async () => {
    accountMemberRepository.findByAccountIdAndUserId.mockResolvedValue(
      member(AccountMemberRole.MEMBER, AccountMemberStatus.ACTIVE),
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

    expect(accountMemberRepository.findManyByAccountId).not.toHaveBeenCalled();
    expect(tenantMemberRepository.findByTenant).not.toHaveBeenCalled();
  });

  it('busca membros existentes e usuários do Tenant informado para OWNER ativo', async () => {
    accountMemberRepository.findByAccountIdAndUserId.mockResolvedValue(
      member(AccountMemberRole.OWNER, AccountMemberStatus.ACTIVE),
    );
    accountMemberRepository.findManyByAccountId.mockResolvedValue([]);
    tenantMemberRepository.findByTenant.mockResolvedValue([]);

    await expect(useCase.execute(input)).resolves.toEqual([]);

    expect(accountMemberRepository.findManyByAccountId).toHaveBeenCalledWith(
      input.accountId,
      input.tenantId,
    );
    expect(tenantMemberRepository.findByTenant).toHaveBeenCalledWith(
      input.tenantId,
    );
  });
});
