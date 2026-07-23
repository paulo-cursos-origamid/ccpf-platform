import { useIdentityStore } from "../../stores/identity.store";


export function useCurrentUser() {
  return useIdentityStore((state) => state.user);
}