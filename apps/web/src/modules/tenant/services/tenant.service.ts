import { api } from "@/lib/api/client";

import type {
  AvailableTenantUser,
  Tenant,
  TenantMember,
  TenantRole,
} from "../types";

/**
 * Dados necessários para adicionar um usuário existente
 * como membro do Tenant atualmente selecionado.
 */
export interface AddTenantMemberInput {
  userId: string;
  role: TenantRole;
}

/**
 * Dados necessários para alterar a role de um membro
 * dentro do Tenant atualmente selecionado.
 */
export interface UpdateTenantMemberRoleInput {
  role: TenantRole;
}

/**
 * Serviço responsável pela comunicação HTTP do domínio Tenant.
 *
 * O serviço conhece apenas os contratos da API e não contém
 * regras de autorização ou regras de negócio.
 */
class TenantService {
  /**
   * Lista os Tenants aos quais o usuário autenticado pertence.
   *
   * A requisição não utiliza X-Tenant-Id porque seu objetivo
   * é justamente descobrir os Tenants disponíveis.
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
   * Lista usuários globais que ainda não possuem vínculo
   * com o Tenant atualmente selecionado.
   *
   * O backend retorna somente usuários ativos e disponíveis.
   */
  listAvailableUsers() {
    return api.get<AvailableTenantUser[]>("/tenants/members/available-users");
  }

  /**
   * Adiciona um usuário existente ao Tenant atual.
   *
   * A autorização definitiva e as regras de limite do plano
   * permanecem no backend.
   */
  addMember(input: AddTenantMemberInput) {
    return api.post<void>("/tenants/members", input);
  }

  /**
   * Altera a role de um membro dentro do Tenant.
   */
  updateMemberRole(memberId: string, input: UpdateTenantMemberRoleInput) {
    return api.patch<TenantMember>(`/tenants/members/${memberId}/role`, input);
  }

  /**
   * Bloqueia um membro do Tenant.
   */
  blockMember(memberId: string) {
    return api.post<TenantMember>(`/tenants/members/${memberId}/block`);
  }

  /**
   * Desbloqueia um membro do Tenant.
   */
  unblockMember(memberId: string) {
    return api.post<TenantMember>(`/tenants/members/${memberId}/unblock`);
  }

    /**
   * Remove logicamente um membro do Tenant.
   *
   * O backend mantém o vínculo persistido com status REMOVED
   * para preservar o histórico e liberar a vaga do plano.
   */
  removeMember(memberId: string) {
    return api.post<void>(`/tenants/members/${memberId}/remove`);
  }
}

export const tenantService = new TenantService();
