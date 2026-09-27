"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Tenant } from "../types";

interface TenantState {
  // Lista de Tenants atualmente disponibilizada pelo backend.
  tenants: Tenant[];

  // ID do Tenant atualmente selecionado.
  activeTenantId: string | null;

  // Indica se os Tenants estão sendo carregados.
  loading: boolean;

  // Substitui a lista de Tenants disponíveis.
  setTenants: (tenants: Tenant[]) => void;

  // Define manualmente o Tenant ativo.
  setActiveTenantId: (tenantId: string) => void;

  // Limpa o contexto de Tenant, utilizado principalmente no logout.
  clear: () => void;

  // Retorna o Tenant atualmente ativo.
  getActiveTenant: () => Tenant | null;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set, get) => ({
      tenants: [],
      activeTenantId: null,
      loading: false,

      setTenants: (tenants) => {
        set((state) => {
          const currentTenantIsValid =
            state.activeTenantId !== null &&
            tenants.some((tenant) => tenant.id === state.activeTenantId);

          const nextActiveTenantId = currentTenantIsValid
            ? state.activeTenantId
            : (tenants[0]?.id ?? null);

          return {
            tenants,
            activeTenantId: nextActiveTenantId,
          };
        });
      },

      setActiveTenantId: (tenantId) => {
        set((state) => {
          const tenantExists = state.tenants.some(
            (tenant) => tenant.id === tenantId,
          );

          if (!tenantExists) {
            return state;
          }

          return {
            activeTenantId: tenantId,
          };
        });
      },

      clear: () => {
        set({
          tenants: [],
          activeTenantId: null,
          loading: false,
        });
      },

      getActiveTenant: () => {
        const { tenants, activeTenantId } = get();

        if (!activeTenantId) {
          return null;
        }

        return (
          tenants.find((tenant) => tenant.id === activeTenantId) ?? null
        );
      },
    }),
    {
      name: "ccpf-tenant",
      partialize: (state) => ({
        activeTenantId: state.activeTenantId,
      }),
    },
  ),
);
