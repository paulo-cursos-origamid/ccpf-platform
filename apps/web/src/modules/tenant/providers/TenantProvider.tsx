"use client";

import { useEffect } from "react";

import { useIdentityStore } from "@/modules/identity/stores/identity.store";

import { tenantService } from "../services";
import { useTenantStore } from "../stores";

interface TenantProviderProps {
  children: React.ReactNode;
}

/**
 * Carrega os espaços aos quais o usuário autenticado tem acesso.
 *
 * Aguarda a inicialização da sessão antes de consultar a API.
 * A lista é sempre validada pelo backend; o navegador persiste
 * somente o identificador do espaço selecionado.
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const isAuthenticated = useIdentityStore(
    (state) => state.isAuthenticated,
  );
  const initialized = useIdentityStore((state) => state.initialized);

  const setTenants = useTenantStore((state) => state.setTenants);
  const setLoading = useTenantStore((state) => state.setLoading);
  const clear = useTenantStore((state) => state.clear);

  useEffect(() => {
    // Não interpretar a sessão como encerrada enquanto ela inicializa.
    if (!initialized) {
      return;
    }

    if (!isAuthenticated) {
      clear();
      return;
    }

    let cancelled = false;

    async function loadTenants() {
      setLoading(true);

      try {
        const tenants = await tenantService.listMine();

        if (cancelled) {
          return;
        }

        setTenants(tenants);
      } catch {
        if (cancelled) {
          return;
        }

        clear();
      }
    }

    void loadTenants();

    return () => {
      cancelled = true;
    };
  }, [
    clear,
    initialized,
    isAuthenticated,
    setLoading,
    setTenants,
  ]);

  return <>{children}</>;
}
