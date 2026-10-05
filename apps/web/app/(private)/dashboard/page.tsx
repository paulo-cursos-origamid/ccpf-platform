"use client";

import { AdminDashboard } from "@/modules/platform-admin";
import { useHasPermission } from "@/modules/identity/hooks/useHasPermission";
import { PLATFORM_PERMISSIONS } from "@/modules/identity/utils";
import { TenantDashboard } from "@/modules/dashboard";

export default function DashboardPage() {
  const canAccessPlatformDashboard = useHasPermission(
    PLATFORM_PERMISSIONS.DASHBOARD_READ,
  );

  if (canAccessPlatformDashboard) {
    return <AdminDashboard />;
  }

  return <TenantDashboard />;
}
