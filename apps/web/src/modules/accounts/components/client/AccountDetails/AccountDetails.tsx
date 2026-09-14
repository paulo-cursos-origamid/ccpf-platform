"use client";

import Link from "next/link";
import { useState } from "react";

import {
  ArrowLeft,
  CircleDollarSign,
  Coins,
  Landmark,
  Lock,
  Pencil,
  Unlock,
  WalletCards,
} from "@/components/icons";

import { Button, Select } from "@/components/ui/forms";

import {
  useAccount,
  useAccountMemberAccess,
  useAccountMembers,
  useUpdateAccount,
  useUpdateAccountMemberRole,
} from "@/modules/accounts/hooks";

import {
  AccountMemberRole,
  AccountMemberStatus,
  AccountStatus,
  AccountType,
} from "@/modules/accounts/types";

import { AddAccountMemberModal } from "../AddAccountMemberModal";
import { EditAccountModal } from "../EditAccountModal/EditAccountModal";

import styles from "./AccountDetails.module.scss";

interface AccountDetailsProps {
  accountId: string;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: "Dinheiro",
  CHECKING: "Conta corrente",
  SAVINGS: "Poupança",
  DIGITAL: "Conta digital",
  INVESTMENT: "Investimento",
  OTHER: "Outro",
};

const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  ACTIVE: "Ativa",
  ARCHIVED: "Arquivada",
};

const ACCOUNT_MEMBER_ROLE_LABELS: Record<AccountMemberRole, string> = {
  OWNER: "Proprietário",
  MANAGER: "Gerente",
  MEMBER: "Membro",
  VIEWER: "Visualizador",
};

const ACCOUNT_MEMBER_STATUS_LABELS: Record<AccountMemberStatus, string> = {
  ACTIVE: "Ativo",
  BLOCKED: "Bloqueado",
};

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Tela de detalhes de uma conta.
 *
 * Além das informações financeiras, apresenta os membros
 * e permite aos usuários autorizados administrar a conta.
 */
export function AccountDetails({ accountId }: AccountDetailsProps) {
  const { account, loading, error, loadAccount } = useAccount(accountId);

  const {
    members,
    loading: membersLoading,
    error: membersError,
    loadMembers,
  } = useAccountMembers(accountId);

  const { updateMemberRole, loading: updatingRole } =
    useUpdateAccountMemberRole();

  const {
    blockMember,
    unblockMember,
    loading: changingAccess,
  } = useAccountMemberAccess();

  const { loading: updatingAccount } = useUpdateAccount();

  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
  const [editAccountModalOpen, setEditAccountModalOpen] = useState(false);

  /**
   * Identifica o membro atualmente em modo de edição.
   */
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  /**
   * Mantém a função selecionada durante a edição.
   *
   * A alteração somente é enviada para a API quando
   * o usuário confirma através do botão "Salvar alterações".
   */
  const [editingMemberRole, setEditingMemberRole] =
    useState<AccountMemberRole | null>(null);

  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.loading}>Carregando conta...</div>
      </section>
    );
  }

  if (error || !account) {
    return (
      <section className={styles.container}>
        <div className={styles.error}>Não foi possível carregar a conta.</div>
      </section>
    );
  }

  const isOwner = account.role === AccountMemberRole.OWNER;

  const canEditAccount =
    account.status === AccountStatus.ACTIVE &&
    (account.role === AccountMemberRole.OWNER ||
      account.role === AccountMemberRole.MANAGER);

  const membersBusy = updatingRole || changingAccess || updatingAccount;

  /**
   * Atualiza os dados da conta após uma edição bem-sucedida.
   */
  async function handleAccountUpdated() {
    await loadAccount();
    setEditAccountModalOpen(false);
  }

  /**
   * Inicia a edição da função de um membro.
   *
   * A função atual é copiada para o estado local para que
   * o usuário possa cancelar sem alterar o dado persistido.
   */
  function handleStartRoleEditing(memberId: string, role: AccountMemberRole) {
    setEditingMemberId(memberId);
    setEditingMemberRole(role);
  }

  /**
   * Cancela a edição da função sem enviar nenhuma alteração
   * para a API.
   */
  function handleCancelRoleEditing() {
    if (membersBusy) {
      return;
    }

    setEditingMemberId(null);
    setEditingMemberRole(null);
  }

  /**
   * Persiste a nova função do membro.
   *
   * A API somente é chamada quando o usuário confirma
   * explicitamente através de "Salvar alterações".
   */
  async function handleSaveRoleChange(memberId: string) {
    if (!editingMemberRole) {
      return;
    }

    try {
      await updateMemberRole(accountId, memberId, {
        role: editingMemberRole,
      });

      setEditingMemberId(null);
      setEditingMemberRole(null);

      await loadMembers();
    } catch {
      // O erro permanece tratado pelo hook.
    }
  }

  /**
   * Bloqueia o acesso de um membro à conta após confirmação.
   */
  async function handleBlock(memberId: string, memberName: string) {
    const confirmed = window.confirm(
      `Bloquear ${memberName} desta conta? O usuário continuará podendo acessar outras contas às quais tenha permissão.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await blockMember(accountId, memberId);
      await loadMembers();
    } catch {
      // O erro permanece tratado pelo hook.
    }
  }

  /**
   * Desbloqueia o acesso de um membro à conta após confirmação.
   */
  async function handleUnblock(memberId: string, memberName: string) {
    const confirmed = window.confirm(
      `Desbloquear ${memberName} e restaurar o acesso a esta conta?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await unblockMember(accountId, memberId);
      await loadMembers();
    } catch {
      // O erro permanece tratado pelo hook.
    }
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <Link
          href="/dashboard/accounts"
          className={styles.titleLink}
          aria-label="Voltar para contas"
        >
          <div className={styles.titleGroup}>
            <div className={styles.icon}>
              <WalletCards size={22} strokeWidth={1.8} />
            </div>

            <div>
              <h1 className={styles.title}>{account.name}</h1>

              <p className={styles.description}>
                Detalhes da conta financeira.
              </p>
            </div>
          </div>
        </Link>

        <div className={styles.headerActions}>
          <span
            className={
              account.status === AccountStatus.ACTIVE
                ? styles.active
                : styles.archived
            }
          >
            {ACCOUNT_STATUS_LABELS[account.status]}
          </span>

          {canEditAccount && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditAccountModalOpen(true)}
              disabled={membersBusy}
            >
              <Pencil size={17} strokeWidth={1.8} />
              Editar
            </Button>
          )}
        </div>
      </header>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <CircleDollarSign size={20} strokeWidth={1.8} />
            <span>Saldo atual</span>
          </div>

          <strong className={styles.balance}>
            {formatCurrency(account.balance, account.currency)}
          </strong>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <WalletCards size={20} strokeWidth={1.8} />
            <span>Saldo inicial</span>
          </div>

          <strong className={styles.value}>
            {formatCurrency(account.initialBalance, account.currency)}
          </strong>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Landmark size={20} strokeWidth={1.8} />
            <span>Tipo</span>
          </div>

          <strong className={styles.value}>
            {ACCOUNT_TYPE_LABELS[account.type]}
          </strong>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Coins size={20} strokeWidth={1.8} />
            <span>Moeda</span>
          </div>

          <strong className={styles.value}>{account.currency}</strong>
        </div>
      </div>

      <section className={styles.membersSection}>
        <div className={styles.membersHeader}>
          <div>
            <h2 className={styles.sectionTitle}>Membros</h2>

            <p className={styles.sectionDescription}>
              Usuários com acesso a esta conta.
            </p>
          </div>

          {isOwner && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setAddMemberModalOpen(true)}
            >
              Adicionar membro
            </Button>
          )}
        </div>

        {membersLoading ? (
          <div className={styles.membersState}>Carregando membros...</div>
        ) : membersError ? (
          <div className={styles.membersStateError}>
            Não foi possível carregar os membros.
          </div>
        ) : members.length === 0 ? (
          <div className={styles.membersState}>Nenhum membro encontrado.</div>
        ) : (
          <div className={styles.membersList}>
            {members.map((member) => {
              const isTargetOwner = member.role === AccountMemberRole.OWNER;

              const isEditing = editingMemberId === member.id;

              return (
                <div key={member.id} className={styles.memberItem}>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberIdentity}>
                      <strong className={styles.memberName}>
                        {member.name}
                      </strong>

                      <span className={styles.memberEmail}>{member.email}</span>
                    </div>

                    {isEditing && isOwner && !isTargetOwner ? (
                      <div className={styles.memberEdit}>
                        <Select
                          id={`member-role-${member.id}`}
                          value={editingMemberRole ?? member.role}
                          disabled={membersBusy}
                          onChange={(event) =>
                            setEditingMemberRole(
                              event.target.value as AccountMemberRole,
                            )
                          }
                          aria-label={`Função de ${member.name}`}
                        >
                          <option value={AccountMemberRole.MANAGER}>
                            Gerente
                          </option>

                          <option value={AccountMemberRole.MEMBER}>
                            Membro
                          </option>

                          <option value={AccountMemberRole.VIEWER}>
                            Visualizador
                          </option>
                        </Select>

                        <div className={styles.memberEditActions}>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={handleCancelRoleEditing}
                            disabled={membersBusy}
                          >
                            Cancelar
                          </Button>

                          <Button
                            type="button"
                            variant="primary"
                            onClick={() => void handleSaveRoleChange(member.id)}
                            loading={updatingRole}
                            disabled={
                              membersBusy || editingMemberRole === member.role
                            }
                          >
                            Salvar alterações
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className={styles.memberDetails}>
                        <span className={styles.memberRole}>
                          {ACCOUNT_MEMBER_ROLE_LABELS[member.role]}
                        </span>

                        <span className={styles.memberStatus}>
                          {ACCOUNT_MEMBER_STATUS_LABELS[member.status]}
                        </span>
                      </div>
                    )}
                  </div>

                  {isOwner && !isTargetOwner && !isEditing && (
                    <div className={styles.memberActions}>
                      <button
                        type="button"
                        className={styles.memberAction}
                        title="Alterar permissão"
                        aria-label={`Alterar permissão de ${member.name}`}
                        disabled={membersBusy}
                        onClick={() =>
                          handleStartRoleEditing(member.id, member.role)
                        }
                      >
                        <Pencil size={17} strokeWidth={1.8} />
                      </button>

                      {member.status === AccountMemberStatus.BLOCKED ? (
                        <button
                          type="button"
                          className={styles.memberAction}
                          title="Desbloquear membro"
                          aria-label={`Desbloquear ${member.name}`}
                          disabled={membersBusy}
                          onClick={() =>
                            void handleUnblock(member.id, member.name)
                          }
                        >
                          <Unlock size={17} strokeWidth={1.8} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.memberAction}
                          title="Bloquear membro"
                          aria-label={`Bloquear ${member.name}`}
                          disabled={membersBusy}
                          onClick={() =>
                            void handleBlock(member.id, member.name)
                          }
                        >
                          <Lock size={17} strokeWidth={1.8} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <AddAccountMemberModal
        open={addMemberModalOpen}
        accountId={accountId}
        onClose={() => setAddMemberModalOpen(false)}
        onSuccess={async () => {
          await loadMembers();
        }}
      />

      <EditAccountModal
        open={editAccountModalOpen}
        account={account}
        onClose={() => setEditAccountModalOpen(false)}
        onSuccess={async () => {
          await handleAccountUpdated();
        }}
      />

      <div className={styles.footerActions}>
        <Link href="/dashboard/accounts" className={styles.backButton}>
          <ArrowLeft size={18} strokeWidth={1.8} />
          <span>Voltar para contas</span>
        </Link>
      </div>
    </section>
  );
}
