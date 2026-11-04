import { Injectable } from '@nestjs/common';
import { FinancialObligationEntity } from '../../../domain/entities/financial-obligation.entity';
import { FinancialObligationRepository } from '../../../domain/repositories/financial-obligation.repository';
import {
  FinancialObligationReferenceInput,
  FinancialObligationsApplicationService,
} from '../../financial-obligations-application.service';

export interface CreateFinancialObligationInput extends FinancialObligationReferenceInput {
  title: string;
  amount: string;
  dueDate: Date;
  counterparty?: string | null;
  description?: string | null;
}

@Injectable()
export class CreateFinancialObligationUseCase {
  constructor(
    private readonly obligations: FinancialObligationsApplicationService,
    private readonly repository: FinancialObligationRepository,
  ) {}

  async execute(input: CreateFinancialObligationInput) {
    await this.obligations.validateReferences(input);
    const obligation = this.obligations.fromDomain(
      () =>
        new FinancialObligationEntity({
          ...input,
          type: input.type,
          dueDate: this.obligations.parseDate(
            input.dueDate,
            'Data de vencimento inválida.',
          ),
        }),
    );
    return this.repository.create(obligation);
  }
}
