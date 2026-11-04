import { Injectable } from '@nestjs/common';
import { FinancialObligationsApplicationService } from '../../financial-obligations-application.service';

@Injectable()
export class GetFinancialObligationUseCase {
  constructor(
    private readonly obligations: FinancialObligationsApplicationService,
  ) {}

  execute(id: string, tenantId: string, userId: string) {
    return this.obligations.findObligation(id, tenantId, userId);
  }
}
