import {
  AuthLayout,
  BrandSection,
  LoginCard,
  LoginForm,
} from "@/modules/identity/components";

export default function LoginPage() {
  return (
    <AuthLayout>
      <BrandSection />

      <LoginCard>
        <LoginForm />
      </LoginCard>
    </AuthLayout>
  );
}
