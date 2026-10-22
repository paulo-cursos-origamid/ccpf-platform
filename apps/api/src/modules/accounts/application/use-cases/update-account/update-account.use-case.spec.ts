import { NotFoundException } from '@nestjs/common';

import { AccountEntity } from '../../../domain/entities/account.entity';
import { AccountMemberEntity } from '../../../domain/entities/account-member.entity';
import { AccountMemberRole } from '../../../domain/enums/account-member-role.enum';
import { AccountMemberStatus } from '../../../domain/enums/account-member-status.enum';
import { AccountType } from '../../../domain/enums/account-type.enum';
import { AccountMemberRepository } from '../../../domain/repositories/account-member.repository';
import { AccountRepository } from '../../../domain/repositories/account.repository';
import { UpdateAccountUseCase } from './update-account.use-case';

describe('UpdateAccountUseCase — isolamento e autorização', () => {
  const accountMemberRepository = {
    findByAccountIdAndUserId: jest.fn(),
  } as unknown as jest.Mocked<AccountMemberRepository>;

  const accountRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<AccountRepository>;

  const useCase = new UpdateAccountUseCase(
    accountRepository,
    accountMemberRepository,
  );

  const input = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    accountId: 'account-1',
    name: 'Conta atualizada',
    type: AccountType.CHECKING,
  };

  const member = (role: AccountMemberRole, status: AccountMemberStatus) =>
    ({
      id: 'member-1',
      accountId: input.accountId,
      userId: input.userId,
      role,
      status,
    }) as AccountMemberEntity;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('consulta o vínculo usando conta, usuário e Tenant informados', async () => {
    accountMemberRepository.findByAccountIdAndUserId.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

    expect(accountMemberRepository.findByAccountIdAndUserId).toHaveBeenCalledWith(
      input.accountId,
      input.userId,
      input.tenantId,
    );
    expect(accountRepository.findById).not.toHaveBeenCalled();
    expect(accountRepository.update).not.toHaveBeenCalled();
  });

  it('impede que membro bloqueado edite a conta', async () => {
    accountMemberRepository.findByAccountIdAndUserId.mockResolvedValue(
      member(AccountMemberRole.OWNER, AccountMemberStatus.BLOCKED),
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

    expect(accountRepository.findById).not.toHaveBeenCalled();
    expect(accountRepository.update).not.toHaveBeenCalled();
  });

  it('impede que MEMBER edite a conta', async () => {
    accountMemberRepository.findByAccountIdAndUserId.mockResolvedValue(
      member(AccountMemberRole.MEMBER, AccountMemberStatus.ACTIVE),
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

    expect(accountRepository.findById).not.toHaveBeenCalled();
    expect(accountRepository.update).not.toHaveBeenCalled();
  });

  it('consulta a conta dentro do Tenant informado para um OWNER ativo', async () => {
    accountMemberRepository.findByAccountIdAndUserId.mockResolvedValue(
      member(AccountMemberRole.OWNER, AccountMemberStatus.ACTIVE),
    );
    accountRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);

    expect(accountRepository.findById).toHaveBeenCalledWith(
      input.accountId,
      input.tenantId,
    );
    expect(accountRepository.update).not.toHaveBeenCalled();
  });
});
