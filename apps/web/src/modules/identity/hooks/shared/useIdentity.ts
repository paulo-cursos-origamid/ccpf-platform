import { useIdentityStore } from "../../stores/identity.store";


export function useIdentity() {
  const user = useIdentityStore((state) => state.user);

  const loading = useIdentityStore((state) => state.loading);

  const isAuthenticated = useIdentityStore(
    (state) => state.isAuthenticated,
  );

  return {
    user,
    loading,
    isAuthenticated,
  };
}