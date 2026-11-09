import { CreditCardEntity } from '../entities/credit-card.entity';

/**
 * Contrato de persistência dos cartões de crédito.
 *
 * Todas as operações recebem tenantId explicitamente
 * para garantir o isolamento entre Tenants.
 */
export abstract class CreditCardRepository {
  abstract create(
    card: CreditCardEntity,
    tenantId: string,
  ): Promise<CreditCardEntity>;

  abstract findById(
    id: string,
    tenantId: string,
  ): Promise<CreditCardEntity | null>;

  abstract findMany(tenantId: string): Promise<CreditCardEntity[]>;

  abstract update(
    card: CreditCardEntity,
    tenantId: string,
  ): Promise<CreditCardEntity>;
}
