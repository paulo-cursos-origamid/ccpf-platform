"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useIdentityStore } from "../../stores/identity.store";

interface AuthBoundaryProps {
  children: React.ReactNode;
}

export function AuthBoundary({ children }: AuthBoundaryProps) {
  const router = useRouter();

  const loading = useIdentityStore((state) => state.loading);

  const initialized = useIdentityStore((state) => state.initialized);

  const isAuthenticated = useIdentityStore((state) => state.isAuthenticated);

  console.log("AuthBoundary state", {
    initialized,
    loading,
    isAuthenticated,
  });

  useEffect(() => {
    if (initialized && !loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [initialized, loading, isAuthenticated, router]);

  if (!initialized || loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
