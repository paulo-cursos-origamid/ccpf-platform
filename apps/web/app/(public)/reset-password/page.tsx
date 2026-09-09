"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  AuthLayout,
  BrandSection,
  LoginCard,
  ResetPasswordForm,
} from "@/modules/identity/components";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") ?? "";

  return (
    <AuthLayout>
      <BrandSection />

      <LoginCard>
        <ResetPasswordForm
          token={token}
          onSuccess={() => router.push("/login")}
        />
      </LoginCard>
    </AuthLayout>
  );
}
