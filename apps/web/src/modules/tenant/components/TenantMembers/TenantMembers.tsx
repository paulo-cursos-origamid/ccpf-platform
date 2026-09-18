"use client";

import { Lock, Pencil, Unlock, Users } from "@/components/icons";
import { Button, Select } from "@/components/ui/forms";

import {
  useTenantMemberAccess,
  useTenantMembers,
  useUpdateTenantMemberRole,
} from "../../hooks";
import { useTenantStore } from "../../stores";

import type { TenantMember, TenantRole } from "../../types";

import styles from "./TenantMembers.module.scss";

/**

* Traduz as roles técnicas do Tenant para os textos apresentados
* na interface.
  */
const roleLabels: Record<TenantRole, string> = {
  OWNER: "Proprietário",
  ADMIN: "Administrador",
  MEMBER: "Membro",
  VIEWER: "Visualizador",
};

/**

* Traduz os estados técnicos do membro para os textos apresentados
* na interface.
  */
const statusLabels: Record<TenantMember["status"], string> = {
  ACTIVE: "Ativo",
  INVITED: "Convidado",
  BLOCKED: "Bloqueado",
  REMOVED: "Removido",
};

/**

* Componente responsável pela apresentação e gerenciamento dos
* membros do Tenant atualmente selecionado.
*
* A autorização definitiva permanece no backend. O frontend apenas
* controla quais ações são apresentadas de acordo com a role do
* usuário no Tenant ativo.
  */
export function TenantMembers() {
  const { members, loading, error, loadMembers } = useTenantMembers();

  const { updateMemberRole, loading: updatingRole } =
    useUpdateTenantMemberRole();

  const {
    blockMember,
    unblockMember,
    loading: updatingAccess,
  } = useTenantMemberAccess();

  const activeTenant = useTenantStore((state) => state.getActiveTenant());

  const canManageMembers =
    activeTenant?.role === "OWNER" || activeTenant?.role === "ADMIN";

  async function handleRoleChange(member: TenantMember, role: TenantRole) {
    if (member.role === "OWNER" || member.role === role) {
      return;
    }

    try {
      await updateMemberRole(member.id, { role });
      await loadMembers();
    } catch {
      // O estado de erro já é mantido pelo hook.
    }
  }

  async function handleToggleAccess(member: TenantMember) {
    try {
      if (member.status === "BLOCKED") {
        await unblockMember(member.id);
      } else {
        await blockMember(member.id);
      }

      await loadMembers();
    } catch {
      // O estado de erro já é mantido pelo hook.
    }
  }

  if (loading) {
    return (
      <section className={styles.container}>
        {" "}
        <div className={styles.loading}>Carregando membros...</div>{" "}
      </section>
    );
  }

  return (
    <section className={styles.container}>
      {" "}
      <header className={styles.header}>
        {" "}
        <div>
          {" "}
          <h1 className={styles.title}>Membros</h1>
          <p className={styles.description}>
            Gerencie os usuários que fazem parte deste Espaço e suas permissões
            de acesso.
          </p>
        </div>
        {canManageMembers && (
          <Button type="button">
            <Users size={18} />
            Adicionar membro
          </Button>
        )}
      </header>
      {Boolean(error) && (
        <div className={styles.error}>
          Não foi possível carregar os membros. Tente novamente.
        </div>
      )}
      {!error && members.length === 0 ? (
        <div className={styles.empty}>
          <p>Nenhum membro encontrado.</p>
        </div>
      ) : (
        <div className={styles.membersSection}>
          <div className={styles.membersHeader}>
            <h2>Membros deste Espaço</h2>

            <span className={styles.memberCount}>
              {members.length} {members.length === 1 ? "membro" : "membros"}
            </span>
          </div>

          <div className={styles.membersList}>
            {members.map((member) => {
              const isOwner = member.role === "OWNER";

              const canEdit =
                canManageMembers && !isOwner && member.status !== "REMOVED";

              const canToggleAccess =
                canManageMembers && !isOwner && member.status !== "REMOVED";

              return (
                <article key={member.id} className={styles.memberItem}>
                  <div className={styles.memberIdentity}>
                    <div className={styles.avatar}>
                      {member.name.charAt(0).toUpperCase()}
                    </div>

                    <div className={styles.memberDetails}>
                      <strong>{member.name}</strong>
                      <span>{member.email}</span>
                    </div>
                  </div>

                  <div className={styles.memberRole}>
                    {canEdit ? (
                      <Select
                        value={member.role}
                        disabled={updatingRole}
                        onChange={(event) =>
                          void handleRoleChange(
                            member,
                            event.target.value as TenantRole,
                          )
                        }
                        aria-label={`Role de ${member.name}`}
                      >
                        <option value="ADMIN">{roleLabels.ADMIN}</option>

                        <option value="MEMBER">{roleLabels.MEMBER}</option>

                        <option value="VIEWER">{roleLabels.VIEWER}</option>
                      </Select>
                    ) : (
                      <span className={styles.roleBadge}>
                        {roleLabels[member.role]}
                      </span>
                    )}
                  </div>

                  <div className={styles.memberStatus}>
                    <span
                      className={`${styles.statusBadge} ${
                        styles[member.status.toLowerCase()]
                      }`}
                    >
                      {statusLabels[member.status]}
                    </span>
                  </div>

                  {canToggleAccess && (
                    <div className={styles.memberActions}>
                      <Button
                        type="button"
                        variant="secondary"
                        loading={updatingAccess}
                        onClick={() => void handleToggleAccess(member)}
                        title={
                          member.status === "BLOCKED"
                            ? "Desbloquear membro"
                            : "Bloquear membro"
                        }
                        aria-label={
                          member.status === "BLOCKED"
                            ? `Desbloquear ${member.name}`
                            : `Bloquear membro ${member.name}`
                        }
                      >
                        {member.status === "BLOCKED" ? (
                          <Unlock size={17} />
                        ) : (
                          <Lock size={17} />
                        )}
                      </Button>
                    </div>
                  )}

                  {canEdit && (
                    <div className={styles.editIndicator}>
                      <Pencil size={15} />
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
