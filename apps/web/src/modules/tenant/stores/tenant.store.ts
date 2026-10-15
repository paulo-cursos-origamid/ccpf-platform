"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Tenant } from "../types";

interface TenantState {
  tenants: Tenant[];
  activeTenantId: string | null;
  loading: boolean;
  setTenants: (tenants: Tenant[]) => void;
  setActiveTenantId: (tenantId: string) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
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
            loading: false,
          };
        });
      },

      setActiveTenantId: (tenantId) => {
        set((state) => {
          const tenantExists = state.tenants.some(
            (tenant) => tenant.id === tenantId,
          );

          if (!tenantExists || state.activeTenantId === tenantId) {
            return state;
          }

          return { activeTenantId: tenantId };
        });
      },

      setLoading: (loading) => set({ loading }),

      clear: () =>
        set({
          tenants: [],
          activeTenantId: null,
          loading: false,
        }),

      getActiveTenant: () => {
        const { tenants, activeTenantId } = get();

        if (!activeTenantId) {
          return null;
        }

        return tenants.find((tenant) => tenant.id === activeTenantId) ?? null;
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
