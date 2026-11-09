import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AccountMemberRole } from '../../accounts/domain/enums/account-member-role.enum';
import { AccountMemberStatus } from '../../accounts/domain/enums/account-member-status.enum';
import { AccountMemberRepository } from '../../accounts/domain/repositories/account-member.repository';
import { AccountRepository } from '../../accounts/domain/repositories/account.repository';
import { CategoryRepository } from '../../categories/domain/repositories/category.repository';
import { FinancialObligationEntity } from '../domain/entities/financial-obligation.entity';
import { FinancialObligationRepository } from '../domain/repositories/financial-obligation.repository';
import { FinancialObligationType } from '../domain/enums/financial-obligation-type.enum';
import { TenantMemberRepository } from '../../tenant/domain/repositories/tenant-member.repository';
import { TenantMemberStatus } from '../../tenant/domain/enums/tenant-member-status.enum';
import { TenantRole } from '../../tenant/domain/enums/tenant-role.enum';

export interface FinancialObligationReferenceInput {
  tenantId: string;
  userId: string;
  type: FinancialObligationType;
  accountId: string;
  categoryId: string;
  subCategoryId?: string | null;
}

@Injectable()
export class FinancialObligationsApplicationService {
  constructor(
    private readonly obligationRepository: FinancialObligationRepository,
    private readonly accountRepository: AccountRepository,
    private readonly accountMemberRepository: AccountMemberRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async findObligation(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<FinancialObligationEntity> {
    const obligation = await this.obligationRepository.findById(
      id,
      tenantId,
      userId,
    );
    if (!obligation) {
      throw new NotFoundException('Compromisso não encontrado neste Espaço.');
    }
    return obligation;
  }

  async validateReferences(
    input: FinancialObligationReferenceInput,
  ): Promise<void> {
    await this.assertAccountAccess(
      input.accountId,
      input.tenantId,
      input.userId,
    );
    const category = await this.categoryRepository.findById(
      input.tenantId,
      input.categoryId,
    );
    const expectedType =
      input.type === FinancialObligationType.PAYABLE ? 'EXPENSE' : 'INCOME';
    if (!category || category.type !== expectedType) {
      throw new BadRequestException(
        'A categoria não corresponde ao tipo do compromisso.',
      );
    }

    if (input.subCategoryId) {
      const subCategory = await this.categoryRepository.findSubCategory(
        input.tenantId,
        category.id,
        input.subCategoryId,
      );
      if (!subCategory) {
        throw new BadRequestException('A subcategoria não está disponível.');
      }
    }
  }

  async assertAccountAccess(
    accountId: string,
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const [account, membership] = await Promise.all([
      this.accountRepository.findById(accountId, tenantId),
      this.accountMemberRepository.findByAccountIdAndUserId(
        accountId,
        userId,
        tenantId,
      ),
    ]);
    if (!account || account.archivedAt) {
      throw new NotFoundException(
        'Conta financeira não encontrada neste Espaço.',
      );
    }
    if (
      !membership ||
      membership.status !== AccountMemberStatus.ACTIVE ||
      membership.role === AccountMemberRole.VIEWER
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar esta conta.',
      );
    }
  }

  async assertTenantWriteAccess(
    tenantId: string,
    userId: string,
  ): Promise<void> {
    const member = await this.tenantMemberRepository.findByTenantAndUser(
      tenantId,
      userId,
    );

    if (!member) {
      throw new NotFoundException(
        'Vínculo com o Espaço não encontrado.',
      );
    }

    if (
      member.status !== TenantMemberStatus.ACTIVE ||
      member.role === TenantRole.VIEWER
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar compromissos deste Espaço.',
      );
    }
  }

  fromDomain<T>(operation: () => T): T {
    try {
      return operation();
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  parseDate(value: Date, message: string): Date {
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestException(message);
    }
    return value;
  }
}
