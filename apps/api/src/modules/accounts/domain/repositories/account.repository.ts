import { AccountEntity } from '../entities/account.entity';

/**
 * Contrato de persistência das contas financeiras.
 *
 * O repositório recebe o tenantId explicitamente porque uma mesma
 * aplicação SaaS pode possuir contas com o mesmo identificador lógico
 * em diferentes Tenants.
 *
 * A implementação deve sempre garantir que as operações de leitura
 * e escrita respeitem o isolamento do Tenant.
 */
export abstract class AccountRepository {
  abstract create(
    account: AccountEntity,
    tenantId: string,
  ): Promise<AccountEntity>;

  abstract findById(
    id: string,
    tenantId: string,
  ): Promise<AccountEntity | null>;

  abstract update(
    account: AccountEntity,
    tenantId: string,
  ): Promise<AccountEntity>;
}
