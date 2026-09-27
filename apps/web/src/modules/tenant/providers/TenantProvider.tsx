"use client";

import { useEffect } from "react";

import { useIdentityStore } from "@/modules/identity/stores/identity.store";

import { tenantService } from "../services";
import { useTenantStore } from "../stores";

interface TenantProviderProps {
  children: React.ReactNode;
}

/**
 * Inicializa e mantém o contexto de Tenant do usuário autenticado.
 *
 * A lista de Tenants é sempre obtida do backend através de
 * GET /tenants/me.
 *
 * Somente o activeTenantId é persistido localmente pelo TenantStore.
 *
 * O carregamento depende explicitamente do estado de autenticação,
 * garantindo que uma troca de usuário provoque uma nova consulta
 * dos Tenants disponíveis.
 */
export function TenantProvider({ children }: TenantProviderProps) {
  const isAuthenticated = useIdentityStore(
    (state) => state.isAuthenticated,
  );

  const setTenants = useTenantStore((state) => state.setTenants);
  const clear = useTenantStore((state) => state.clear);

  useEffect(() => {
    if (!isAuthenticated) {
      clear();
      return;
    }

    let cancelled = false;

    async function loadTenants() {
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
  }, [clear, isAuthenticated, setTenants]);

  return <>{children}</>;
}
