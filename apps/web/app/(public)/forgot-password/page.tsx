"use client";

import { useRouter } from "next/navigation";

import {
  AuthLayout,
  BrandSection,
  ForgotPasswordForm,
  LoginCard,
} from "@/modules/identity/components";

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <AuthLayout>
      <BrandSection />

      <LoginCard>
        <ForgotPasswordForm
          onSuccess={() => router.push("/check-email")}
        />
      </LoginCard>
    </AuthLayout>
  );
  }
