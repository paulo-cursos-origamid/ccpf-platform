"use client";

import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { AuthBoundary } from "@/modules/identity/components/client/AuthBoundary";
import { TenantProvider } from "@/modules/tenant/providers/TenantProvider";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <AuthBoundary>
      <TenantProvider>
        <AppLayout>{children}</AppLayout>
      </TenantProvider>
    </AuthBoundary>
  );
}
