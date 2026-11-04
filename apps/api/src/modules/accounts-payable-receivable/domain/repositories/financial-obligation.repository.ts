import { FinancialObligationEntity } from '../entities/financial-obligation.entity';
import { FinancialObligationStatus } from '../enums/financial-obligation-status.enum';
import { FinancialObligationType } from '../enums/financial-obligation-type.enum';

/** Filtros opcionais para consultas isoladas pelo tenant e usuário. */
export interface FinancialObligationFilters {
  type?: FinancialObligationType;
  status?: FinancialObligationStatus;
}

/** Dados necessários para liquidar ou vincular uma transação existente. */
export interface SettleFinancialObligationOptions {
  userId: string;
  settledAt: Date;
  transactionId?: string;
  description?: string;
}

/** Contrato de persistência consumido pelos casos de uso do domínio. */
export abstract class FinancialObligationRepository {
  abstract create(
    obligation: FinancialObligationEntity,
  ): Promise<FinancialObligationEntity>;

  abstract findById(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<FinancialObligationEntity | null>;

  abstract findMany(
    tenantId: string,
    userId: string,
    filters: FinancialObligationFilters,
  ): Promise<FinancialObligationEntity[]>;

  abstract update(
    obligation: FinancialObligationEntity,
  ): Promise<FinancialObligationEntity>;

  abstract cancel(obligation: FinancialObligationEntity): Promise<void>;

  abstract settle(
    obligation: FinancialObligationEntity,
    options: SettleFinancialObligationOptions,
  ): Promise<FinancialObligationEntity>;
}
