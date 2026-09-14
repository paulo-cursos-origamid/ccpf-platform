"use client";

import { useState } from "react";

import { UserRound } from "@/components/icons";
import { Button, Field, Select } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";

import {
  useAddAccountMember,
  useAvailableAccountUsers,
} from "@/modules/accounts/hooks";
import { AccountMemberRole } from "@/modules/accounts/types";

import styles from "./AddAccountMemberModal.module.scss";

interface AddAccountMemberModalProps {
  open: boolean;
  accountId: string;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

const ACCOUNT_MEMBER_ROLE_OPTIONS: Array<{
  value: AccountMemberRole;
  label: string;
}> = [
  {
    value: AccountMemberRole.OWNER,
    label: "Proprietário",
  },
  {
    value: AccountMemberRole.MANAGER,
    label: "Gerente",
  },
  {
    value: AccountMemberRole.MEMBER,
    label: "Membro",
  },
  {
    value: AccountMemberRole.VIEWER,
    label: "Visualizador",
  },
];

export function AddAccountMemberModal({
  open,
  accountId,
  onClose,
  onSuccess,
}: AddAccountMemberModalProps) {
  const {
    users,
    loading: usersLoading,
    error: usersError,
  } = useAvailableAccountUsers(accountId, open);

  const {
    addAccountMember,
    loading: addingMember,
    error: addMemberError,
  } = useAddAccountMember();

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<AccountMemberRole>(
    AccountMemberRole.MEMBER,
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const loading = usersLoading || addingMember;

  // O backend já retorna somente usuários que não pertencem à conta.
  const availableUsers = users;

  // Fecha o modal somente quando não existe uma operação em andamento.
  // A limpeza dos campos acontece aqui para evitar efeitos síncronos
  // de atualização de estado durante a renderização do componente.
  function handleClose() {
    if (loading) {
      return;
    }

    setUserId("");
    setRole(AccountMemberRole.MEMBER);
    setValidationError(null);

    onClose();
  }

  // Valida a seleção, cria o vínculo na API e atualiza a lista
  // de membros antes de fechar o modal.
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setValidationError(null);

    if (!userId) {
      setValidationError("Selecione um usuário.");
      return;
    }

    try {
      await addAccountMember(accountId, {
        userId,
        role,
      });

      await onSuccess();

      handleClose();
    } catch {
      // O erro da API permanece disponível através do hook.
    }
  }

  const errorMessage =
    validationError ??
    (addMemberError instanceof Error ? addMemberError.message : null);

  const userListError =
    usersError instanceof Error
      ? usersError.message
      : usersError
        ? "Não foi possível carregar os usuários."
        : null;

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Adicionar membro"
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.description}>
          Conceda acesso a outro usuário nesta conta.
        </p>

        <Field
          label="Usuário"
          htmlFor="add-account-member-user"
          required
          error={userListError ?? undefined}
        >
          <div className={styles.userField}>
            <UserRound size={18} className={styles.userIcon} />

            <Select
              id="add-account-member-user"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              disabled={loading || !!userListError}
              aria-label="Usuário"
            >
              <option value="">
                {usersLoading
                  ? "Carregando usuários..."
                  : "Selecione um usuário"}
              </option>

              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.email}
                </option>
              ))}
            </Select>
          </div>
        </Field>

        <Field
          label="Função"
          htmlFor="add-account-member-role"
          required
        >
          <Select
            id="add-account-member-role"
            value={role}
            onChange={(event) =>
              setRole(event.target.value as AccountMemberRole)
            }
            disabled={loading}
          >
            {ACCOUNT_MEMBER_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        {!usersLoading && !userListError && availableUsers.length === 0 && (
          <div className={styles.info} role="status">
            Todos os usuários disponíveis já são membros desta conta.
          </div>
        )}

        {errorMessage && (
          <div className={styles.error} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            loading={addingMember}
            disabled={loading || !userId}
          >
            Adicionar membro
          </Button>
        </div>
      </form>
    </Modal>
  );
}
