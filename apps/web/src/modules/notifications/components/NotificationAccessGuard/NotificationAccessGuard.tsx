"use client";

import type { ReactNode } from "react";

import { useHasPermission } from "@/modules/identity/hooks/useHasPermission";
import { PLATFORM_PERMISSIONS } from "@/modules/identity/utils";
import { useTenantStore } from "@/modules/tenant/stores";

import styles from "./NotificationAccessGuard.module.scss";

interface NotificationAccessGuardProps {
  children: ReactNode;
}

export function NotificationAccessGuard({
  children,
}: NotificationAccessGuardProps) {
  const canAccessDashboard = useHasPermission(
    PLATFORM_PERMISSIONS.DASHBOARD_READ,
  );

  const activeTenantRole = useTenantStore((state) => {
    const activeTenant = state.tenants.find(
      (tenant) => tenant.id === state.activeTenantId,
    );

    return activeTenant?.role ?? null;
  });

  const isTenantAdmin =
    activeTenantRole === "OWNER" || activeTenantRole === "ADMIN";

  const canAccessNotifications =
    canAccessDashboard || isTenantAdmin;

  if (!canAccessNotifications) {
    return (
      <section className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Acesso restrito</h1>

          <p className={styles.message}>
            Você não possui permissão para acessar a Central de Avisos.
          </p>
        </div>
      </section>
    );
  }

  return <>{children}</>;
}