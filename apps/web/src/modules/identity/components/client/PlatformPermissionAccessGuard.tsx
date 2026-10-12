"use client";

import type { ReactNode } from "react";

import { useHasPermission } from "@/modules/identity/hooks/useHasPermission";
import type { PlatformPermission } from "@/modules/identity/utils/permissions";

interface PlatformPermissionAccessGuardProps {
  permission: PlatformPermission;
  children: ReactNode;
}

/**
 * Evita exibir páginas administrativas a usuários sem a permissão exigida.
 * A autorização definitiva continua no backend.
 */
export function PlatformPermissionAccessGuard({
  permission,
  children,
}: PlatformPermissionAccessGuardProps) {
  const allowed = useHasPermission(permission);

  if (!allowed) {
    return (
      <main>
        <h1>Acesso restrito</h1>
        <p>Você não possui permissão para acessar esta página.</p>
      </main>
    );
  }

  return <>{children}</>;
}
