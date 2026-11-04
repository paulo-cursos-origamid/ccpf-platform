import { ConflictException, Injectable } from '@nestjs/common';
import { FinancialObligationStatus } from '../../../domain/enums/financial-obligation-status.enum';
import { FinancialObligationRepository } from '../../../domain/repositories/financial-obligation.repository';
import { FinancialObligationsApplicationService } from '../../financial-obligations-application.service';

@Injectable()
export class CancelFinancialObligationUseCase {
  constructor(
    private readonly obligations: FinancialObligationsApplicationService,
    private readonly repository: FinancialObligationRepository,
  ) {}

  async execute(id: string, tenantId: string, userId: string) {
    const obligation = await this.obligations.findObligation(
      id,
      tenantId,
      userId,
    );
    if (obligation.status !== FinancialObligationStatus.PENDING) {
      throw new ConflictException(
        'Somente compromissos pendentes podem ser cancelados.',
      );
    }
    await this.obligations.assertAccountAccess(
      obligation.accountId,
      tenantId,
      userId,
    );
    this.obligations.fromDomain(() => obligation.cancel());
    await this.repository.cancel(obligation);
    return obligation;
  }
}
