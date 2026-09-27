/**
 * Representa um usuário global que ainda não possui
 * vínculo com o Tenant atualmente selecionado.
 *
 * Esses dados são utilizados exclusivamente para permitir
 * a seleção de um usuário no fluxo de adição de membros.
 */
export interface AvailableTenantUser {
  id: string;
  name: string;
  email: string;
}
