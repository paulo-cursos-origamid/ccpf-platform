import { Injectable } from '@nestjs/common';
import {
  FinancialObligationFilters,
  FinancialObligationRepository,
} from '../../../domain/repositories/financial-obligation.repository';

@Injectable()
export class ListFinancialObligationsUseCase {
  constructor(private readonly repository: FinancialObligationRepository) {}

  execute(
    tenantId: string,
    userId: string,
    filters: FinancialObligationFilters,
  ) {
    return this.repository.findMany(tenantId, userId, filters);
  }
}
