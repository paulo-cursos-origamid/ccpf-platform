"use client";

import { useState } from "react";

import { tenantService } from "../../services/tenant.service";

/**
 * Hook responsável pelas operações de bloqueio e desbloqueio
 * de membros dentro do Tenant atualmente selecionado.
 */
export function useTenantMemberAccess() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  /**
   * Bloqueia um membro do Tenant.
   */
  async function blockMember(memberId: string) {
    setLoading(true);
    setError(null);

    try {
      return await tenantService.blockMember(memberId);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Desbloqueia um membro do Tenant.
   */
  async function unblockMember(memberId: string) {
    setLoading(true);
    setError(null);

    try {
      return await tenantService.unblockMember(memberId);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    blockMember,
    unblockMember,
    loading,
    error,
  };
}
