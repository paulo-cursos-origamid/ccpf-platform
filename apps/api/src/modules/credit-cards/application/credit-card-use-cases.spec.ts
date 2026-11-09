import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { TenantMemberEntity } from '../../tenant/domain/entities/tenant-member.entity';
import { TenantMemberRepository } from '../../tenant/domain/repositories/tenant-member.repository';
import { TenantMemberStatus } from '../../tenant/domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../tenant/domain/enums/tenant-role.enum';

import { CreditCardEntity } from '../domain/entities/credit-card.entity';
import { CreditCardBrand } from '../domain/enums/credit-card-brand.enum';
import { CreditCardStatus } from '../domain/enums/credit-card-status.enum';
import { CreditCardRepository } from '../domain/repositories/credit-card.repository';

import { CreateCreditCardUseCase } from './use-cases/create-credit-card/create-credit-card.use-case';
import { ListCreditCardsUseCase } from './use-cases/list-credit-cards/list-credit-cards.use-case';
import { GetCreditCardUseCase } from './use-cases/get-credit-card/get-credit-card.use-case';
import { UpdateCreditCardUseCase } from './use-cases/update-credit-card/update-credit-card.use-case';
import { ArchiveCreditCardUseCase } from './use-cases/archive-credit-card/archive-credit-card.use-case';

describe('Credit card use cases — autorização e isolamento', () => {
  const repository = {
    create: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<CreditCardRepository>;

  const memberRepository = {
    findByTenantAndUser: jest.fn(),
  } as unknown as jest.Mocked<TenantMemberRepository>;

  const createUseCase = new CreateCreditCardUseCase(
    repository,
    memberRepository,
  );
  const listUseCase = new ListCreditCardsUseCase(repository, memberRepository);
  const getUseCase = new GetCreditCardUseCase(repository, memberRepository);
  const updateUseCase = new UpdateCreditCardUseCase(
    repository,
    memberRepository,
  );
  const archiveUseCase = new ArchiveCreditCardUseCase(
    repository,
    memberRepository,
  );

  const input = {
    userId: 'user-1',
    tenantId: 'tenant-1',
    cardId: 'card-1',
    name: 'Cartão principal',
    brand: CreditCardBrand.VISA,
    lastFourDigits: '1234',
    creditLimit: 5000,
    closingDay: 10,
    dueDay: 17,
  };

  const makeMember = (role: TenantRole, status = TenantMemberStatus.ACTIVE) =>
    ({
      id: 'member-1',
      tenantId: input.tenantId,
      userId: input.userId,
      role,
      status,
    }) as TenantMemberEntity;

  const makeCard = () =>
    new CreditCardEntity({
      id: input.cardId,
      tenantId: input.tenantId,
      name: input.name,
      brand: input.brand,
      lastFourDigits: input.lastFourDigits,
      creditLimit: input.creditLimit,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
    });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('permissões de leitura', () => {
    it.each([
      TenantRole.OWNER,
      TenantRole.ADMIN,
      TenantRole.MEMBER,
      TenantRole.VIEWER,
    ])('permite listar para membro ACTIVE com papel %s', async (role) => {
      memberRepository.findByTenantAndUser.mockResolvedValue(makeMember(role));
      repository.findMany.mockResolvedValue([]);

      await expect(listUseCase.execute(input)).resolves.toEqual([]);

      expect(memberRepository.findByTenantAndUser).toHaveBeenCalledWith(
        input.tenantId,
        input.userId,
      );
      expect(repository.findMany).toHaveBeenCalledWith(input.tenantId);
    });

    it('impede listagem sem vínculo com o Tenant', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(null);

      await expect(listUseCase.execute(input)).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.findMany).not.toHaveBeenCalled();
    });

    it('impede consulta para membro bloqueado', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.OWNER, TenantMemberStatus.BLOCKED),
      );

      await expect(getUseCase.execute(input)).rejects.toThrow(
        ForbiddenException,
      );

      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('consulta cartão usando id e Tenant informados', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.VIEWER),
      );
      repository.findById.mockResolvedValue(makeCard());

      const result = await getUseCase.execute(input);

      expect(result.id).toBe(input.cardId);
      expect(repository.findById).toHaveBeenCalledWith(
        input.cardId,
        input.tenantId,
      );
    });

    it('retorna NotFound quando o cartão não pertence ao Tenant', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.MEMBER),
      );
      repository.findById.mockResolvedValue(null);

      await expect(getUseCase.execute(input)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('permissões de escrita', () => {
    it.each([TenantRole.OWNER, TenantRole.ADMIN])(
      'permite criar cartão para %s',
      async (role) => {
        memberRepository.findByTenantAndUser.mockResolvedValue(
          makeMember(role),
        );
        repository.create.mockImplementation(async (card) => card);

        const result = await createUseCase.execute(input);

        expect(result.tenantId).toBe(input.tenantId);
        expect(repository.create).toHaveBeenCalledWith(
          expect.any(CreditCardEntity),
          input.tenantId,
        );
      },
    );

    it.each([TenantRole.MEMBER, TenantRole.VIEWER])(
      'impede %s de criar cartão',
      async (role) => {
        memberRepository.findByTenantAndUser.mockResolvedValue(
          makeMember(role),
        );

        await expect(createUseCase.execute(input)).rejects.toThrow(
          ForbiddenException,
        );

        expect(repository.create).not.toHaveBeenCalled();
      },
    );

    it('impede criação para membro REMOVED', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.OWNER, TenantMemberStatus.REMOVED),
      );

      await expect(createUseCase.execute(input)).rejects.toThrow(
        ForbiddenException,
      );

      expect(repository.create).not.toHaveBeenCalled();
    });

    it('atualiza cartão após validar OWNER e Tenant', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.OWNER),
      );
      repository.findById.mockResolvedValue(makeCard());
      repository.update.mockImplementation(async (card) => card);

      const result = await updateUseCase.execute({
        ...input,
        name: 'Cartão atualizado',
      });

      expect(result.name).toBe('Cartão atualizado');
      expect(repository.findById).toHaveBeenCalledWith(
        input.cardId,
        input.tenantId,
      );
      expect(repository.update).toHaveBeenCalledWith(
        expect.any(CreditCardEntity),
        input.tenantId,
      );
    });

    it('impede MEMBER de atualizar cartão', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.MEMBER),
      );

      await expect(updateUseCase.execute(input)).rejects.toThrow(
        ForbiddenException,
      );

      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('não atualiza cartão inexistente', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.ADMIN),
      );
      repository.findById.mockResolvedValue(null);

      await expect(updateUseCase.execute(input)).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.update).not.toHaveBeenCalled();
    });

    it('arquiva cartão sem exclusão física', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.ADMIN),
      );
      repository.findById.mockResolvedValue(makeCard());
      repository.update.mockImplementation(async (card) => card);

      const result = await archiveUseCase.execute(input);

      expect(result.status).toBe(CreditCardStatus.ARCHIVED);
      expect(result.archivedAt).toBeInstanceOf(Date);
      expect(repository.update).toHaveBeenCalledWith(
        expect.any(CreditCardEntity),
        input.tenantId,
      );
    });

    it('impede VIEWER de arquivar cartão', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.VIEWER),
      );

      await expect(archiveUseCase.execute(input)).rejects.toThrow(
        ForbiddenException,
      );

      expect(repository.findById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('não arquiva cartão inexistente', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.OWNER),
      );
      repository.findById.mockResolvedValue(null);

      await expect(archiveUseCase.execute(input)).rejects.toThrow(
        NotFoundException,
      );

      expect(repository.update).not.toHaveBeenCalled();
    });
  });


  describe('bloqueio de membros com vínculo inativo', () => {
    it.each([
      TenantMemberStatus.INVITED,
      TenantMemberStatus.BLOCKED,
      TenantMemberStatus.REMOVED,
    ])(
      'bloqueia todas as operações para status %s',
      async (status) => {
        memberRepository.findByTenantAndUser.mockResolvedValue(
          makeMember(TenantRole.OWNER, status),
        );

        const operations = [
          () => listUseCase.execute(input),
          () => getUseCase.execute(input),
          () => createUseCase.execute(input),
          () => updateUseCase.execute(input),
          () => archiveUseCase.execute(input),
        ];

        for (const operation of operations) {
          await expect(operation()).rejects.toThrow(ForbiddenException);
        }

        expect(memberRepository.findByTenantAndUser).toHaveBeenCalledTimes(5);
        expect(repository.findMany).not.toHaveBeenCalled();
        expect(repository.findById).not.toHaveBeenCalled();
        expect(repository.create).not.toHaveBeenCalled();
        expect(repository.update).not.toHaveBeenCalled();
      },
    );
  });

  describe('permissão de ADMIN para atualizar', () => {
    it('permite ADMIN atualizar cartão', async () => {
      memberRepository.findByTenantAndUser.mockResolvedValue(
        makeMember(TenantRole.ADMIN),
      );
      repository.findById.mockResolvedValue(makeCard());
      repository.update.mockImplementation(async (card) => card);

      const result = await updateUseCase.execute({
        ...input,
        name: 'Cartão atualizado por ADMIN',
      });

      expect(result.name).toBe('Cartão atualizado por ADMIN');
      expect(repository.findById).toHaveBeenCalledWith(
        input.cardId,
        input.tenantId,
      );
      expect(repository.update).toHaveBeenCalledWith(
        expect.any(CreditCardEntity),
        input.tenantId,
      );
    });
  });

});
