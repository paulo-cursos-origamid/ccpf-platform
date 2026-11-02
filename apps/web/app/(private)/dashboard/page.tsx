"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { AdminDashboard } from "@/modules/platform-admin";
import { TenantDashboard } from "@/modules/dashboard";
import { useHasPermission } from "@/modules/identity/hooks/useHasPermission";
import { PLATFORM_PERMISSIONS } from "@/modules/identity/utils";

export default function DashboardPage() {
  const router = useRouter();

  const canAccessPlatformDashboard = useHasPermission(
    PLATFORM_PERMISSIONS.DASHBOARD_READ,
  );

  const canManageBilling = useHasPermission(
    PLATFORM_PERMISSIONS.BILLING_MANAGE,
  );

  useEffect(() => {
    if (!canAccessPlatformDashboard && canManageBilling) {
      router.replace("/admin/billing/invoices");
    }
  }, [canAccessPlatformDashboard, canManageBilling, router]);

  if (canAccessPlatformDashboard) {
    return <AdminDashboard />;
  }

  if (canManageBilling) {
    return null;
  }

  return <TenantDashboard />;
}
