"use client";

import { useState } from "react";

import { tenantService } from "../../services/tenant.service";

/**
 * Hook responsável por remover logicamente um membro
 * do Tenant atualmente selecionado.
 *
 * A autorização definitiva permanece no backend.
 */
export function useRemoveTenantMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  /**
   * Remove o membro do Tenant.
   */
  async function removeTenantMember(memberId: string) {
    setLoading(true);
    setError(null);

    try {
      return await tenantService.removeMember(memberId);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    removeTenantMember,
    loading,
    error,
  };
}
