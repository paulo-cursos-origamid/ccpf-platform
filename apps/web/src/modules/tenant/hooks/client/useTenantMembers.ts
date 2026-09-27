"use client";

import { useCallback, useEffect, useState } from "react";

import { tenantService } from "../../services/tenant.service";

import type { TenantMember } from "../../types";

/**
 * Hook responsável por carregar e atualizar a lista de membros
 * do Tenant atualmente selecionado.
 *
 * O Tenant ativo é resolvido pelo ApiClient através do
 * X-Tenant-Id, portanto o componente não precisa conhecer
 * diretamente o identificador do Tenant.
 */
export function useTenantMembers() {
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  /**
   * Recarrega a lista de membros do Tenant ativo.
   *
   * É exposto para que operações como adicionar, alterar role,
   * bloquear ou desbloquear possam atualizar a lista após sucesso.
   */
  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await tenantService.listMembers();

      setMembers(response);

      return response;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carrega os membros quando o componente que utiliza o hook
   * é montado.
   */
  useEffect(() => {
    let cancelled = false;

    async function fetchMembers() {
      try {
        const response = await tenantService.listMembers();

        if (cancelled) {
          return;
        }

        setMembers(response);
        setLoading(false);
        setError(null);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setMembers([]);
        setLoading(false);
        setError(error);
      }
    }

    void fetchMembers();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    members,
    loading,
    error,
    loadMembers,
  };
}
