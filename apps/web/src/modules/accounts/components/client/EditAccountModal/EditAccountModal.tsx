"use client";

import { useState } from "react";

import { Button, Field, Select, TextInput } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";

import { useUpdateAccount } from "@/modules/accounts/hooks";
import {
  AccountType,
  type Account,
} from "@/modules/accounts/types";

import styles from "./EditAccountModal.module.scss";

interface EditAccountModalProps {
  open: boolean;
  account: Account;
  onClose: () => void;
  onSuccess: (account: Account) => Promise<void> | void;
}

const ACCOUNT_TYPE_OPTIONS: Array<{
  value: AccountType;
  label: string;
}> = [
  { value: AccountType.CASH, label: "Dinheiro" },
  { value: AccountType.CHECKING, label: "Conta corrente" },
  { value: AccountType.SAVINGS, label: "Poupança" },
  { value: AccountType.DIGITAL, label: "Conta digital" },
  { value: AccountType.INVESTMENT, label: "Investimento" },
  { value: AccountType.OTHER, label: "Outro" },
];

/**
 * Modal responsável pela edição dos dados cadastrais da conta.
 *
 * Permite alterar somente o nome e o tipo da conta.
 * Dados financeiros como saldo, saldo inicial e moeda
 * permanecem protegidos pela regra de domínio.
 */
export function EditAccountModal({
  open,
  account,
  onClose,
  onSuccess,
}: EditAccountModalProps) {
  const { updateAccount, loading, error } = useUpdateAccount();

  const [name, setName] = useState(account.name);
  const [type, setType] = useState<AccountType>(account.type);
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleClose() {
    if (loading) {
      return;
    }

    setName(account.name);
    setType(account.type);
    setValidationError(null);

    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setValidationError(null);

    const normalizedName = name.trim();

    if (normalizedName.length < 2) {
      setValidationError(
        "O nome da conta deve ter pelo menos 2 caracteres.",
      );
      return;
    }

    if (normalizedName.length > 100) {
      setValidationError(
        "O nome da conta deve ter no máximo 100 caracteres.",
      );
      return;
    }

    try {
      const updatedAccount = await updateAccount(account.id, {
        name: normalizedName,
        type,
      });

      await onSuccess(updatedAccount);
      onClose();
    } catch {
      // O erro da API permanece disponível através do hook.
    }
  }

  const errorMessage =
    validationError ??
    (error instanceof Error
      ? error.message
      : error
        ? "Não foi possível atualizar a conta."
        : null);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Editar conta"
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.description}>
          Atualize os dados cadastrais da conta.
        </p>

        <Field
          label="Nome da conta"
          htmlFor="edit-account-name"
          required
        >
          <TextInput
            id="edit-account-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={loading}
            placeholder="Nome da conta"
            autoComplete="off"
          />
        </Field>

        <Field
          label="Tipo da conta"
          htmlFor="edit-account-type"
          required
        >
          <Select
            id="edit-account-type"
            value={type}
            onChange={(event) =>
              setType(event.target.value as AccountType)
            }
            disabled={loading}
          >
            {ACCOUNT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

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
            loading={loading}
            disabled={loading || !name.trim()}
          >
            Salvar alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
