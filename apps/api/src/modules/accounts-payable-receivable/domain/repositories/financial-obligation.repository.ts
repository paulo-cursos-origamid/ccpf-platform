import { FinancialObligationEntity } from '../entities/financial-obligation.entity';
import { FinancialObligationSettlementEntity } from '../entities/financial-obligation-settlement.entity';
import { FinancialObligationStatus } from '../enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../enums/financial-obligation-type.enum';

export interface FinancialObligationFilters {
  type?: FinancialObligationType;
  status?: FinancialObligationStatus;
}

export interface SettleFinancialObligationOptions {
  settlement: FinancialObligationSettlementEntity;
  description?: string;
}

export abstract class FinancialObligationRepository {
  abstract create(obligation: FinancialObligationEntity): Promise<FinancialObligationEntity>;
  abstract findById(id: string, tenantId: string, userId: string): Promise<FinancialObligationEntity | null>;
  abstract findMany(tenantId: string, userId: string, filters: FinancialObligationFilters): Promise<FinancialObligationEntity[]>;
  abstract update(obligation: FinancialObligationEntity): Promise<FinancialObligationEntity>;
  abstract cancel(obligation: FinancialObligationEntity): Promise<void>;
  abstract settle(
    obligation: FinancialObligationEntity,
    options: SettleFinancialObligationOptions,
  ): Promise<FinancialObligationEntity>;
}
