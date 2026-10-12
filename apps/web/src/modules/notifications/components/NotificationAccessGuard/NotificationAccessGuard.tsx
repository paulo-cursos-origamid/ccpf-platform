"use client";

import type { ReactNode } from "react";

import { useHasPermission } from "@/modules/identity/hooks/useHasPermission";
import { PLATFORM_PERMISSIONS } from "@/modules/identity/utils";

import styles from "./NotificationAccessGuard.module.scss";

interface NotificationAccessGuardProps {
  children: ReactNode;
}

/**
 * Protege a Central de Avisos administrativa no frontend.
 *
 * A permissão utilizada é DASHBOARD_READ, já existente na arquitetura
 * de plataforma. O backend continua sendo a autoridade definitiva
 * sobre autorização e acesso aos dados.
 */
export function NotificationAccessGuard({
  children,
}: NotificationAccessGuardProps) {
  const canAccessNotifications = useHasPermission(
    PLATFORM_PERMISSIONS.DASHBOARD_READ,
  );

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
