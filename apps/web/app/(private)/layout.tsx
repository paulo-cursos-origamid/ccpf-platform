"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useIdentityStore } from "@/modules/identity/stores/identity.store";

export default function PrivateLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  const {
    isAuthenticated,
    loading,
    initialize,
  } = useIdentityStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [
    loading,
    isAuthenticated,
    router,
  ]);

  if (loading) {
    return (
      <div>
        Carregando...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}