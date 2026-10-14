"use client";

import { useIdentityStore } from "../stores/identity.store";
import {
  hasAnyPermission,
  hasPermission,
  type PlatformPermission,
} from "../utils/permissions";

/**
 * Hook responsável por consultar permissões globais do usuário
 * autenticado para controle da interface.
 *
 * A autorização definitiva continua sendo realizada pelo backend.
 */
export function useHasPermission(permission: PlatformPermission): boolean {
  const permissions = useIdentityStore(
    (state) => state.user?.platformPermissions,
  );

  return hasPermission(permissions, permission);
}

/**
 * Hook para verificar se o usuário possui pelo menos uma
 * das permissões informadas.
 */
export function useHasAnyPermission(
  requiredPermissions: readonly PlatformPermission[],
): boolean {
  const permissions = useIdentityStore(
    (state) => state.user?.platformPermissions,
  );

  return hasAnyPermission(permissions, requiredPermissions);
}
