"use client";

import { useState } from "react";

import { Lock, Trash2, Unlock, Users } from "@/components/icons";
import { Button, Select } from "@/components/ui/forms";

import { useTenantSubscription } from "@/modules/billing/hooks";

import { AddTenantMemberModal } from "./AddTenantMemberModal";

import {
  useRemoveTenantMember,
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
 * usuário no Tenant ativo e com os limites comerciais do plano.
 */
export function TenantMembers() {
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);

  const { members, loading, error, loadMembers } = useTenantMembers();

  const { updateMemberRole, loading: updatingRole } =
    useUpdateTenantMemberRole();

  const {
    blockMember,
    unblockMember,
    loading: updatingAccess,
  } = useTenantMemberAccess();

  const { removeTenantMember, loading: removingMember } =
    useRemoveTenantMember();

  const {
    currentUsers,
    maxUsers,
    hasUnlimitedUsers,
    hasCommercialAccess,
    loading: subscriptionLoading,
    reload: reloadSubscription,
  } = useTenantSubscription();

  const activeTenant = useTenantStore((state) => state.getActiveTenant());

  const isOwner = activeTenant?.role === "OWNER";

  const canManageMembers = isOwner || activeTenant?.role === "ADMIN";

  /**
   * Verifica se o plano permite adicionar mais um usuário.
   *
   * O valor -1 representa usuários ilimitados.
   */
  const hasReachedUserLimit =
    !hasUnlimitedUsers && maxUsers !== null && currentUsers >= maxUsers;

  const canAddMember =
    canManageMembers &&
    !subscriptionLoading &&
    hasCommercialAccess &&
    !hasReachedUserLimit;

  async function handleRoleChange(member: TenantMember, role: TenantRole) {
    if (member.role === "OWNER" || member.role === role) {
      return;
    }

    try {
      await updateMemberRole(member.id, { role });

      await Promise.all([loadMembers(), reloadSubscription()]);
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

      await Promise.all([loadMembers(), reloadSubscription()]);
    } catch {
      // O estado de erro já é mantido pelo hook.
    }
  }

  async function handleRemoveMember(member: TenantMember) {
    if (!isOwner || member.role === "OWNER") {
      return;
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja remover ${member.name} deste Espaço?\n\n` +
        "O usuário perderá o acesso a este Espaço e a vaga será liberada no plano.",
    );

    if (!confirmed) {
      return;
    }

    setRemovingMemberId(member.id);

    try {
      await removeTenantMember(member.id);

      await Promise.all([loadMembers(), reloadSubscription()]);
    } catch {
      // O estado de erro já é mantido pelo hook.
    } finally {
      setRemovingMemberId(null);
    }
  }

  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.loading}>Carregando membros...</div>
      </section>
    );
  }

  return (
    <>
      <section className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Membros</h1>

            <p className={styles.description}>
              Gerencie os usuários que fazem parte deste Espaço e suas
              permissões de acesso.
            </p>
          </div>

          {canManageMembers && (
            <Button
              type="button"
              disabled={!canAddMember}
              onClick={() => setAddMemberModalOpen(true)}
              title={
                hasReachedUserLimit
                  ? "O limite de usuários do plano foi atingido"
                  : undefined
              }
            >
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

        {!error && !subscriptionLoading && maxUsers !== null && (
          <div
            className={`${styles.planLimit} ${
              hasReachedUserLimit ? styles.planLimitReached : ""
            }`}
          >
            <div className={styles.planLimitHeader}>
              <span>Uso do plano</span>

              <strong>
                {hasUnlimitedUsers
                  ? `${currentUsers} usuários`
                  : `${currentUsers} / ${maxUsers} usuários`}
              </strong>
            </div>

            {!hasUnlimitedUsers && (
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressBar}
                  style={{
                    width: `${Math.min((currentUsers / maxUsers) * 100, 100)}%`,
                  }}
                />
              </div>
            )}

            {hasReachedUserLimit && (
              <p className={styles.limitMessage}>
                O limite de usuários do plano atual foi atingido. Para
                adicionar novos membros, remova um membro existente ou utilize
                um plano com maior capacidade.
              </p>
            )}

            {!hasReachedUserLimit && (
              <p className={styles.limitHint}>
                Membros bloqueados continuam ocupando uma vaga. Somente membros
                removidos liberam capacidade.
              </p>
            )}
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
                const memberIsOwner = member.role === "OWNER";

                /**
                 * Somente membros que não são OWNER e não estão removidos
                 * podem ter sua role alterada.
                 */
                const canEditRole =
                  canManageMembers &&
                  !memberIsOwner &&
                  member.status !== "REMOVED";

                /**
                 * Somente membros que não são OWNER e não estão removidos
                 * podem ter seu acesso bloqueado ou desbloqueado.
                 */
                const canToggleAccess =
                  canManageMembers &&
                  !memberIsOwner &&
                  member.status !== "REMOVED";

                /**
                 * Somente o OWNER do Tenant pode remover membros.
                 */
                const canRemove =
                  isOwner && !memberIsOwner && member.status !== "REMOVED";

                const isRemoving = removingMemberId === member.id;

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
                      {canEditRole ? (
                        <Select
                          value={member.role}
                          disabled={
                            updatingRole || updatingAccess || removingMember
                          }
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

                    {(canToggleAccess || canRemove) && (
                      <div className={styles.memberActions}>
                        {canToggleAccess && (
                          <Button
                            type="button"
                            variant="secondary"
                            loading={updatingAccess}
                            disabled={removingMember || updatingRole}
                            onClick={() =>
                              void handleToggleAccess(member)
                            }
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
                        )}

                        {canRemove && (
                          <Button
                            type="button"
                            variant="secondary"
                            loading={isRemoving}
                            disabled={
                              removingMember ||
                              updatingAccess ||
                              updatingRole
                            }
                            onClick={() =>
                              void handleRemoveMember(member)
                            }
                            title="Remover membro"
                            aria-label={`Remover ${member.name}`}
                          >
                            <Trash2 size={17} />
                          </Button>
                        )}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <AddTenantMemberModal
        open={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        onSuccess={async () => {
          await Promise.all([loadMembers(), reloadSubscription()]);
        }}
      />
    </>
  );
}