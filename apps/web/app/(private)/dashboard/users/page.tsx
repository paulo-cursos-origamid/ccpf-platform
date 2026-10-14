import { ListUsers } from "@/modules/identity/components/client/ListUsers";
import { PlatformPermissionAccessGuard } from "@/modules/identity/components/client/PlatformPermissionAccessGuard";
import { PLATFORM_PERMISSIONS } from "@/modules/identity/utils";

export default function UsersPage() {
  return (
    <PlatformPermissionAccessGuard permission={PLATFORM_PERMISSIONS.USERS_READ}>
      <main>
        <ListUsers />
      </main>
    </PlatformPermissionAccessGuard>
  );
}
