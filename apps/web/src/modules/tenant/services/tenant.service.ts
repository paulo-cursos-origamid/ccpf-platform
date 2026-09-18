import { api } from "@/lib/api/client";

import type { Tenant, TenantMember, TenantRole } from "../types";

/**
 * Dados necessários para adicionar um usuário existente ao Tenant.
 */
export interface AddTenantMemberInput {
  userId: string;
  role: TenantRole;
}

/**
 * Dados necessários para alterar o papel de um membro.
 */
export interface UpdateTenantMemberRoleInput {
  role: TenantRole;
}

/**
 * Centraliza as chamadas HTTP relacionadas ao domínio Tenant.
 *
 * O Tenant ativo não é recebido explicitamente pelos métodos.
 * O ApiClient adiciona automaticamente o header X-Tenant-Id
 * usando o activeTenantId mantido pelo TenantStore.
 */
class TenantService {
  /**
   * Obtém os Tenants aos quais o usuário autenticado possui acesso.
   *
   * Este endpoint é utilizado para descobrir os Tenants disponíveis
   * e, por isso, não deve enviar o header X-Tenant-Id.
   */
  listMine() {
    return api.get<Tenant[]>("/tenants/me", {
      tenantAware: false,
    });
  }

  /**
   * Lista os membros do Tenant atualmente selecionado.
   */
  listMembers() {
    return api.get<TenantMember[]>("/tenants/members");
  }

  /**
   * Adiciona um usuário existente ao Tenant ativo.
   */
  addMember(input: AddTenantMemberInput) {
    return api.post<TenantMember>("/tenants/members", input);
  }

  /**
   * Altera o papel de um membro dentro do Tenant ativo.
   */
  updateMemberRole(memberId: string, input: UpdateTenantMemberRoleInput) {
    return api.patch<TenantMember>(`/tenants/members/${memberId}/role`, input);
  }

  /**
   * Bloqueia um membro do Tenant ativo.
   */
  blockMember(memberId: string) {
    return api.post<TenantMember>(`/tenants/members/${memberId}/block`);
  }

  /**
   * Desbloqueia um membro do Tenant ativo.
   */
  unblockMember(memberId: string) {
    return api.post<TenantMember>(`/tenants/members/${memberId}/unblock`);
  }
}

export const tenantService = new TenantService();
