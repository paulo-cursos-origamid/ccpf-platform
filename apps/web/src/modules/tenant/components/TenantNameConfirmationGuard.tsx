"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useIdentityStore } from "@/modules/identity/stores/identity.store";
import { useTenantStore } from "@/modules/tenant/stores";

const CONFIRMATION_PATH = "/onboarding/confirm-company";

export function TenantNameConfirmationGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const initialized = useIdentityStore((state) => state.initialized);
  const isAuthenticated = useIdentityStore((state) => state.isAuthenticated);

  const tenants = useTenantStore((state) => state.tenants);
  const activeTenantId = useTenantStore((state) => state.activeTenantId);
  const loading = useTenantStore((state) => state.loading);

  useEffect(() => {
    if (!initialized || !isAuthenticated || loading) return;

    // A página de confirmação deve continuar acessível para permitir a correção.
    if (pathname === CONFIRMATION_PATH) return;

    const activeTenant = tenants.find(
      (tenant) => tenant.id === activeTenantId,
    );

    // Não bloquear contas sem tenant selecionado; outros fluxos podem criá-lo.
    if (activeTenant && !activeTenant.nameConfirmed) {
      router.replace(CONFIRMATION_PATH);
    }
  }, [
    initialized,
    isAuthenticated,
    loading,
    tenants,
    activeTenantId,
    pathname,
    router,
  ]);

  return <>{children}</>;
}
