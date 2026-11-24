import { FinancialObligationEntity } from '../entities/financial-obligation.entity';
import { FinancialObligationSettlementEntity } from '../entities/financial-obligation-settlement.entity';
import { FinancialObligationStatus } from '../enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../enums/financial-obligation-type.enum';
import { FinancialObligationSourceType } from '../enums/financial-obligation-source-type.enum';

export interface FinancialObligationFilters {
  type?: FinancialObligationType;
  status?: FinancialObligationStatus;
  sourceType?: FinancialObligationSourceType;
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface FinancialObligationInstallmentPaymentStatus {
  earlyCount: number;
  earlyAmount: string;
  onTimeCount: number;
  onTimeAmount: string;
  overdueCount: number;
  overdueAmount: string;
  currentCount: number;
  currentAmount: string;
}

export interface FinancialObligationSummary {
  totalCount: number;
  pendingCount: number;
  partiallySettledCount: number;
  settledCount: number;
  canceledCount: number;
  totalRemainingAmount: string;
  overdueCount: number;
  overdueRemainingAmount: string;
  installmentPaymentStatus?: FinancialObligationInstallmentPaymentStatus;
}

export interface PaginatedFinancialObligations {
  data: FinancialObligationEntity[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  summary: FinancialObligationSummary;
}

export interface SettleFinancialObligationOptions {
  settlement: FinancialObligationSettlementEntity;
  description?: string;
}

export abstract class FinancialObligationRepository {
  abstract create(obligation: FinancialObligationEntity): Promise<FinancialObligationEntity>;
  abstract createOrFindBySource(obligation: FinancialObligationEntity): Promise<FinancialObligationEntity>;
  abstract findById(id: string, tenantId: string, userId: string): Promise<FinancialObligationEntity | null>;
  abstract findBySource(tenantId: string, userId: string, sourceType: FinancialObligationSourceType, sourceId: string): Promise<FinancialObligationEntity | null>;
  abstract findMany(tenantId: string, userId: string, filters: FinancialObligationFilters): Promise<FinancialObligationEntity[]>;
  abstract findManyPaginated(
    tenantId: string,
    userId: string,
    filters: FinancialObligationFilters,
  ): Promise<PaginatedFinancialObligations>;
  abstract update(obligation: FinancialObligationEntity): Promise<FinancialObligationEntity>;
  abstract cancel(obligation: FinancialObligationEntity): Promise<void>;
  abstract settle(
    obligation: FinancialObligationEntity,
    options: SettleFinancialObligationOptions,
  ): Promise<FinancialObligationEntity>;
}
