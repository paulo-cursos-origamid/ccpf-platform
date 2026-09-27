"use client";

import { useState } from "react";

import { UserRound } from "@/components/icons";
import { Button, Field, Select } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";

import {
  useAddTenantMember,
  useAvailableTenantUsers,
} from "../../../hooks";

import type { TenantRole } from "../../../types";

import styles from "./AddTenantMemberModal.module.scss";

interface AddTenantMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

const TENANT_MEMBER_ROLE_OPTIONS: Array<{
  value: Exclude<TenantRole, "OWNER">;
  label: string;
}> = [
  {
    value: "ADMIN",
    label: "Administrador",
  },
  {
    value: "MEMBER",
    label: "Membro",
  },
  {
    value: "VIEWER",
    label: "Visualizador",
  },
];

export function AddTenantMemberModal({
  open,
  onClose,
  onSuccess,
}: AddTenantMemberModalProps) {
  const {
    users,
    loading: usersLoading,
    error: usersError,
  } = useAvailableTenantUsers(open);

  const {
    addTenantMember,
    loading: addingMember,
    error: addMemberError,
  } = useAddTenantMember();

  const [userId, setUserId] = useState("");
  const [role, setRole] =
    useState<Exclude<TenantRole, "OWNER">>("MEMBER");
  const [validationError, setValidationError] =
    useState<string | null>(null);

  const loading = usersLoading || addingMember;

  /**
   * Fecha o modal somente quando nenhuma operação está
   * em andamento e restaura o estado inicial do formulário.
   */
  function handleClose() {
    if (loading) {
      return;
    }

    setUserId("");
    setRole("MEMBER");
    setValidationError(null);

    onClose();
  }

  /**
   * Valida o formulário, cria o vínculo do usuário com o Tenant
   * e atualiza a lista de membros antes de fechar o modal.
   */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setValidationError(null);

    if (!userId) {
      setValidationError("Selecione um usuário.");
      return;
    }

    try {
      await addTenantMember({
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
    (addMemberError instanceof Error
      ? addMemberError.message
      : null);

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
          Adicione outro usuário a este Espaço e defina o nível
          de acesso que ele terá.
        </p>

        <Field
          label="Usuário"
          htmlFor="add-tenant-member-user"
          required
          error={userListError ?? undefined}
        >
          <div className={styles.userField}>
            <UserRound
              size={18}
              className={styles.userIcon}
            />

            <Select
              id="add-tenant-member-user"
              value={userId}
              onChange={(event) =>
                setUserId(event.target.value)
              }
              disabled={loading || !!userListError}
              aria-label="Usuário"
            >
              <option value="">
                {usersLoading
                  ? "Carregando usuários..."
                  : "Selecione um usuário"}
              </option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} — {user.email}
                </option>
              ))}
            </Select>
          </div>
        </Field>

        <Field
          label="Função"
          htmlFor="add-tenant-member-role"
          required
        >
          <Select
            id="add-tenant-member-role"
            value={role}
            onChange={(event) =>
              setRole(
                event.target.value as Exclude<
                  TenantRole,
                  "OWNER"
                >,
              )
            }
            disabled={loading}
          >
            {TENANT_MEMBER_ROLE_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        {!usersLoading &&
          !userListError &&
          users.length === 0 && (
            <div className={styles.info} role="status">
              Todos os usuários disponíveis já são membros
              deste Espaço.
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
