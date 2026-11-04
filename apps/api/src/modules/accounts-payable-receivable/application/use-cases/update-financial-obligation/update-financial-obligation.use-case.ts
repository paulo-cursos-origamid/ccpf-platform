import { ConflictException, Injectable } from '@nestjs/common';
import { FinancialObligationEntity } from '../../../domain/entities/financial-obligation.entity';
import { FinancialObligationStatus } from '../../../domain/enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../../../domain/enums/financial-obligation-type.enum';
import { FinancialObligationRepository } from '../../../domain/repositories/financial-obligation.repository';
import { FinancialObligationsApplicationService } from '../../financial-obligations-application.service';

export interface UpdateFinancialObligationInput {
  id: string;
  tenantId: string;
  userId: string;
  type?: FinancialObligationType;
  title?: string;
  amount?: string;
  dueDate?: Date;
  accountId?: string;
  categoryId?: string;
  subCategoryId?: string | null;
  counterparty?: string | null;
  description?: string | null;
}

@Injectable()
export class UpdateFinancialObligationUseCase {
  constructor(
    private readonly obligations: FinancialObligationsApplicationService,
    private readonly repository: FinancialObligationRepository,
  ) {}

  async execute(input: UpdateFinancialObligationInput) {
    const obligation = await this.obligations.findObligation(
      input.id,
      input.tenantId,
      input.userId,
    );
    if (obligation.status !== FinancialObligationStatus.PENDING) {
      throw new ConflictException(
        'Somente compromissos pendentes podem ser alterados.',
      );
    }

    const values = {
      type: input.type ?? obligation.type,
      accountId: input.accountId ?? obligation.accountId,
      categoryId: input.categoryId ?? obligation.categoryId,
      subCategoryId:
        input.subCategoryId === undefined
          ? obligation.subCategoryId
          : input.subCategoryId,
    };
    await this.obligations.validateReferences({
      ...values,
      tenantId: input.tenantId,
      userId: input.userId,
    });
    this.obligations.fromDomain(() =>
      obligation.updateDetails({
        ...values,
        title: input.title ?? obligation.title,
        amount: input.amount ?? obligation.amount,
        dueDate:
          input.dueDate === undefined
            ? obligation.dueDate
            : this.obligations.parseDate(
                input.dueDate,
                'Data de vencimento inválida.',
              ),
        counterparty:
          input.counterparty === undefined
            ? obligation.counterparty
            : input.counterparty,
        description:
          input.description === undefined
            ? obligation.description
            : input.description,
      }),
    );
    return this.repository.update(obligation);
  }
}
