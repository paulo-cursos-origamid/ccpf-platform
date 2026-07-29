"use client";

import type { ReactNode } from "react";

import { AppLayout } from "@/components/layout/AppLayout";
import { AuthBoundary } from "@/modules/identity/components/AuthBoundary";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  return (
    <AuthBoundary>
      <AppLayout>{children}</AppLayout>
    </AuthBoundary>
  );
}
