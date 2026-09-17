"use client";

import { useEffect, useRef } from "react";

import { tenantService } from "../services";
import { useTenantStore } from "../stores";

interface TenantProviderProps {
  children: React.ReactNode;
}

// Inicializa o contexto de Tenant depois que o usuário estiver autenticado.
//
// A lista de Tenants sempre vem do backend.
// Apenas o ID do Tenant ativo é persistido localmente.
export function TenantProvider({ children }: TenantProviderProps) {
  const setTenants = useTenantStore((state) => state.setTenants);
  const clear = useTenantStore((state) => state.clear);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    async function loadTenants() {
      try {
        const tenants = await tenantService.listMine();

        setTenants(tenants);
      } catch {
        clear();
      }
    }

    void loadTenants();
  }, [clear, setTenants]);

  return <>{children}</>;
}
