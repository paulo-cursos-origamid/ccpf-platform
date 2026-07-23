import { useIdentityStore } from "../../stores/identity.store";


export function useLogout() {
  const logout = useIdentityStore((state) => state.logout);

  const loading = useIdentityStore((state) => state.loading);

  return {
    logout,
    loading,
  };
}