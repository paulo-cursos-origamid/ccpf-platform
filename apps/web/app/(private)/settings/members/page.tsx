import { TenantMembers } from "@/modules/tenant/components";

/**

* Página de gerenciamento dos membros do Tenant ativo.
*
* A rota pertence ao contexto de configurações do sistema,
* enquanto a implementação da gestão de membros permanece
* no módulo Tenant.
  */
export default function TenantMembersPage() {
  return <TenantMembers />;
}
