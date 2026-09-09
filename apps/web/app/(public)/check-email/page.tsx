"use client";

import {
  AuthLayout,
  BrandSection,
  CheckEmail,
  LoginCard,
} from "@/modules/identity/components";

export default function CheckEmailPage() {
  return (
    <AuthLayout>
      <BrandSection />

      <LoginCard>
        <CheckEmail />
      </LoginCard>
    </AuthLayout>
  );
}
