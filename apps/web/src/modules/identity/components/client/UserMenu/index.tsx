"use client";

import { useLogout } from "@/modules/identity/hooks/client";

export function UserMenu() {
  const { logout } = useLogout();

  return (
    <button onClick={logout}>
      Sair
    </button>
  );
}