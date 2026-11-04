import { ConflictException, Injectable } from '@nestjs/common';
import { FinancialObligationStatus } from '../../../domain/enums/financial-obligation-status.enum';
import { FinancialObligationRepository } from '../../../domain/repositories/financial-obligation.repository';
import { FinancialObligationsApplicationService } from '../../financial-obligations-application.service';

export interface SettleFinancialObligationInput {
  id: string;
  tenantId: string;
  userId: string;
  settledAt: Date;
  transactionId?: string;
  description?: string;
}

@Injectable()
export class SettleFinancialObligationUseCase {
  constructor(
    private readonly obligations: FinancialObligationsApplicationService,
    private readonly repository: FinancialObligationRepository,
  ) {}

  async execute(input: SettleFinancialObligationInput) {
    const obligation = await this.obligations.findObligation(
      input.id,
      input.tenantId,
      input.userId,
    );
    if (obligation.status !== FinancialObligationStatus.PENDING) {
      throw new ConflictException(
        'Este compromisso já foi liquidado ou cancelado.',
      );
    }
    await this.obligations.validateReferences({
      tenantId: input.tenantId,
      userId: input.userId,
      type: obligation.type,
      accountId: obligation.accountId,
      categoryId: obligation.categoryId,
      subCategoryId: obligation.subCategoryId,
    });
    const settledAt = this.obligations.parseDate(
      input.settledAt,
      'Data de liquidação inválida.',
    );
    this.obligations.fromDomain(() => obligation.settle(settledAt));
    if (input.transactionId) {
      this.obligations.fromDomain(() =>
        obligation.linkTransaction(input.transactionId!),
      );
    }
    return this.repository.settle(obligation, {
      userId: input.userId,
      settledAt,
      transactionId: input.transactionId,
      description: input.description,
    });
  }
}
