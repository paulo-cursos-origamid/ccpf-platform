import { AccountMemberEntity } from '../entities/account-member.entity';

/**
 * Contrato de persistência dos membros de uma conta.
 *
 * Como Accounts pertencem a um Tenant, todas as operações de leitura
 * precisam receber o tenantId para garantir isolamento entre clientes.
 *
 * O repositório não decide quem pode executar a operação.
 * Essa responsabilidade permanece nos guards e use cases.
 */
export abstract class AccountMemberRepository {
  /**
   * Cria um vínculo entre usuário e conta.
   */
  abstract create(member: AccountMemberEntity): Promise<AccountMemberEntity>;

  /**
   * Atualiza papel e status do vínculo.
   */
  abstract update(member: AccountMemberEntity): Promise<AccountMemberEntity>;

  /**
   * Remove definitivamente o vínculo.
   */
  abstract delete(member: AccountMemberEntity): Promise<void>;

  /**
   * Busca um membro específico garantindo que a conta
   * pertença ao Tenant informado.
   */
  abstract findByAccountIdAndUserId(
    accountId: string,
    userId: string,
    tenantId: string,
  ): Promise<AccountMemberEntity | null>;

  /**
   * Lista os membros de uma conta dentro do Tenant informado.
   */
  abstract findManyByAccountId(
    accountId: string,
    tenantId: string,
  ): Promise<AccountMemberEntity[]>;

  /**
   * Lista os vínculos de um usuário dentro do Tenant informado.
   */
  abstract findManyByUserId(
    userId: string,
    tenantId: string,
  ): Promise<AccountMemberEntity[]>;
}
