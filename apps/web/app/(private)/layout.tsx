"use client";
import { TenantNameConfirmationGuard } from "@/modules/tenant/components/TenantNameConfirmationGuard";

import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { AuthBoundary } from "@/modules/identity/components/client/AuthBoundary";
import { TenantProvider } from "@/modules/tenant/providers/TenantProvider";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <AuthBoundary>
      <TenantProvider>
        <TenantNameConfirmationGuard>
        <AppLayout>{children}</AppLayout>
      </TenantNameConfirmationGuard>
      </TenantProvider>
    </AuthBoundary>
  );
}
