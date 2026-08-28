import { useCurrentUser } from "@/modules/identity/hooks/shared";


export function UserAvatar() {
  const user = useCurrentUser();

  return <span>{user?.name}</span>;
}