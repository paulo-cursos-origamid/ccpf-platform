"use client";

import { useState } from "react";

import {
  tenantService,
  type UpdateTenantMemberRoleInput,
} from "../../services/tenant.service";

/**
 * Hook responsável por alterar a role de um membro
 * dentro do Tenant atualmente selecionado.
 */
export function useUpdateTenantMemberRole() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  /**
   * Altera a role do membro.
   */
  async function updateMemberRole(
    memberId: string,
    data: UpdateTenantMemberRoleInput,
  ) {
    setLoading(true);
    setError(null);

    try {
      return await tenantService.updateMemberRole(memberId, data);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    updateMemberRole,
    loading,
    error,
  };
}
