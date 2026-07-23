import { useIdentity } from "../shared";


export function useRequireAuth() {
  const identity = useIdentity();

  return identity;
}