"use client";

import { useState } from "react";

import {
  tenantService,
  type AddTenantMemberInput,
} from "../../services/tenant.service";

/**
 * Hook responsável por adicionar um usuário existente
 * ao Tenant atualmente selecionado.
 *
 * Controla os estados de carregamento e erro da operação
 * e delega a comunicação HTTP para o TenantService.
 */
export function useAddTenantMember() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  /**
   * Adiciona um usuário ao Tenant com a role informada.
   */
  async function addTenantMember(data: AddTenantMemberInput) {
    setLoading(true);
    setError(null);

    try {
      return await tenantService.addMember(data);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  return {
    addTenantMember,
    loading,
    error,
  };
}
