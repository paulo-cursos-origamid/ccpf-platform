"use client";

import { useEffect, useRef } from "react";

import { useIdentityStore } from "../stores/identity.store";

interface IdentityProviderProps {
  children: React.ReactNode;
}

export function IdentityProvider({ children }: IdentityProviderProps) {
  const initialize = useIdentityStore((state) => state.initialize);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) {
      return;
    }

    initialized.current = true;

    void initialize();
  }, [initialize]);

  return <>{children}</>;
}
