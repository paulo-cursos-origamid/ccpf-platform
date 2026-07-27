"use client";

import { useEffect } from "react";

import { useIdentityStore } from "../stores/identity.store";

interface IdentityProviderProps {
  children: React.ReactNode;
}

export function IdentityProvider({
  children,
}: IdentityProviderProps) {
  const initialize = useIdentityStore(
    (state) => state.initialize,
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  return <>{children}</>;
}