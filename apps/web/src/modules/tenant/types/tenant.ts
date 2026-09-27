import type { TenantRole } from "./tenant-role";

// Representa um Tenant disponibilizado pelo backend para o usuário autenticado.
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: TenantRole;
}
