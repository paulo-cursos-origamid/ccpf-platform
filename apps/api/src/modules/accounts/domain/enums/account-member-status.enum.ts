/**
 * Status de acesso de um usuário dentro de uma conta financeira.
 *
 * ACTIVE:
 * O membro possui acesso normal à conta.
 *
 * BLOCKED:
 * O vínculo permanece cadastrado, mas o membro não pode operar
 * ou acessar a conta enquanto estiver bloqueado.
 */
export enum AccountMemberStatus {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}
