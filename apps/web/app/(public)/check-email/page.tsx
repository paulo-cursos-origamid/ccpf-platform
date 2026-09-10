"use client";

import { useSearchParams } from "next/navigation";

import {
  AuthLayout,
  BrandSection,
  CheckEmail,
  LoginCard,
} from "@/modules/identity/components";

export default function CheckEmailPage() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";

  return (
    <AuthLayout>
      <BrandSection />

      <LoginCard>
        <CheckEmail token={token} />
      </LoginCard>
    </AuthLayout>
  );
}