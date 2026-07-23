import { useRouter } from "next/navigation";
import { useIdentityStore } from "../../stores/identity.store";
import type { LoginDto } from "../../types/login.dto";

export function useLogin() {
  const login = useIdentityStore((state) => state.login);
  const router = useRouter();

  const loading = useIdentityStore((state) => state.loading);

  async function handleLogin(data: LoginDto) {
    await login(data);
    router.push("/dashboard");
  }

  return {
    login: handleLogin,
    loading,
  };
}
