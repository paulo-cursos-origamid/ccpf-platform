import { ConflictException, Injectable, BadRequestException } from '@nestjs/common';
import { FinancialObligationSettlementEntity } from '../../../domain/entities/financial-obligation-settlement.entity';
import { FinancialObligationStatus } from '../../../domain/enums/financial-obligation-status.enum';
import { FinancialObligationSourceType } from '../../../domain/enums/financial-obligation-source-type.enum';
import { FinancialObligationRepository } from '../../../domain/repositories/financial-obligation.repository';
import { FinancialObligationsApplicationService } from '../../financial-obligations-application.service';

export interface SettleFinancialObligationInput {
  id: string;
  tenantId: string;
  userId: string;
  accountId?: string;
  settledAt: Date;
  principalAmount?: string;
  interestAmount?: string;
  feeAmount?: string;
  discountAmount?: string;
  transactionId?: string;
  description?: string;
}

@Injectable()
export class SettleFinancialObligationUseCase {
  constructor(
    private readonly repository: FinancialObligationRepository,
    private readonly obligations: FinancialObligationsApplicationService,
  ) {}

  async execute(input: SettleFinancialObligationInput) {
    const obligation = await this.obligations.findObligation(
      input.id,
      input.tenantId,
      input.userId,
    );

    if (
      obligation.status !== FinancialObligationStatus.PENDING &&
      obligation.status !== FinancialObligationStatus.PARTIALLY_SETTLED
    ) {
      throw new ConflictException(
        'Somente compromissos em aberto podem receber liquidações.',
      );
    }

    const isCardInvoice =
      obligation.sourceType ===
      FinancialObligationSourceType.CREDIT_CARD_INVOICE;

    const obligationAccountId = obligation.accountId;
    const settlementAccountId = isCardInvoice
      ? input.accountId?.trim()
      : obligationAccountId;

    if (!settlementAccountId) {
      throw new BadRequestException(
        isCardInvoice
          ? 'Selecione a conta bancária utilizada para pagar a fatura.'
          : 'A conta de referência do compromisso não está disponível.',
      );
    }

    if (isCardInvoice) {
      if (input.transactionId) {
        throw new ConflictException(
          'O pagamento de fatura de cartão não pode ser vinculado a uma transação.',
        );
      }

      await this.obligations.assertTenantWriteAccess(
        obligation.tenantId,
        input.userId,
      );

      await this.obligations.assertAccountAccess(
        settlementAccountId,
        obligation.tenantId,
        input.userId,
      );
    } else {
      if (!obligationAccountId) {
        throw new BadRequestException(
          'A conta de referência do compromisso não está disponível.',
        );
      }

      if (input.accountId && input.accountId !== obligationAccountId) {
        throw new ConflictException(
          'A conta utilizada deve ser a conta de referência do compromisso.',
        );
      }

      if (!obligation.categoryId) {
        throw new BadRequestException(
          'A categoria da obrigação não está disponível para liquidação.',
        );
      }

      await this.obligations.validateReferences({
        accountId: obligationAccountId,
        categoryId: obligation.categoryId,
        subCategoryId: obligation.subCategoryId,
        type: obligation.type,
        tenantId: obligation.tenantId,
        userId: input.userId,
      });
    }

    const settledAt = this.obligations.parseDate(
      input.settledAt,
      'Data da liquidação inválida.',
    );

    const discountAmount = input.discountAmount ?? '0.00';
    const principalAmount = input.principalAmount ?? obligation.remainingAmount;

    let settlement: FinancialObligationSettlementEntity;

    try {
      settlement = new FinancialObligationSettlementEntity({
        obligationId: obligation.id,
        tenantId: obligation.tenantId,
        userId: input.userId,
        accountId: settlementAccountId,
        principalAmount,
        interestAmount: input.interestAmount ?? '0.00',
        feeAmount: input.feeAmount ?? '0.00',
        discountAmount,
        settledAt,
        transactionId: input.transactionId,
      });

      obligation.registerSettlement(settlement);
    } catch (error) {
      throw new ConflictException(
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a liquidação.',
      );
    }

    return this.repository.settle(obligation, {
      settlement,
      description: input.description,
    });
  }
}
