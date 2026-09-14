/**
 * Status do acesso de um usuário dentro de uma conta.
 *
 * O status pertence ao vínculo com a conta e não ao usuário global.
 */
export enum AccountMemberStatus {
  ACTIVE = "ACTIVE",
  BLOCKED = "BLOCKED",
}
