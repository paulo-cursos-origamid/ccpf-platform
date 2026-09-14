"use client";

import { useState } from "react";

import { CircleDollarSign, Coins, WalletCards } from "@/components/icons";
import { Button, Field, Input, Select } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";

import { useCreateAccount } from "@/modules/accounts/hooks";
import { AccountType, type Account } from "@/modules/accounts/types";

import styles from "./CreateAccountModal.module.scss";

interface CreateAccountModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: (account: Account) => void;
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

export function CreateAccountModal({
  open,
  onClose,
  onCreated,
}: CreateAccountModalProps) {
  const { createAccount, loading } = useCreateAccount();

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>(AccountType.CHECKING);
  const [currency, setCurrency] = useState("BRL");
  const [initialBalance, setInitialBalance] = useState("0");
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    if (loading) {
      return;
    }

    onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);

    const parsedBalance = Number(initialBalance);

    if (!name.trim()) {
      setError("Informe o nome da conta.");
      return;
    }

    if (!currency.trim()) {
      setError("Informe a moeda da conta.");
      return;
    }

    if (!Number.isFinite(parsedBalance)) {
      setError("Informe um saldo inicial válido.");
      return;
    }

    try {
      const account = await createAccount({
        name: name.trim(),
        type,
        currency: currency.trim().toUpperCase(),
        initialBalance: parsedBalance,
      });

      onCreated?.(account);

      setName("");
      setType(AccountType.CHECKING);
      setCurrency("BRL");
      setInitialBalance("0");

      onClose();
    } catch {
      setError("Não foi possível criar a conta.");
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Nova conta"
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.description}>
          Cadastre uma nova conta financeira.
        </p>

        <Field label="Nome" htmlFor="account-name" required>
          <Input
            id="account-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Conta principal"
            disabled={loading}
            autoFocus
            leftIcon={<WalletCards size={18} strokeWidth={1.8} />}
          />
        </Field>

        <Field label="Tipo" htmlFor="account-type" required>
          <Select
            id="account-type"
            value={type}
            onChange={(event) => setType(event.target.value as AccountType)}
            disabled={loading}
          >
            {ACCOUNT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <div className={styles.row}>
          <Field
            label="Moeda"
            htmlFor="account-currency"
            required
            className={styles.field}
          >
            <Input
              id="account-currency"
              type="text"
              value={currency}
              onChange={(event) =>
                setCurrency(event.target.value.toUpperCase())
              }
              placeholder="BRL"
              maxLength={3}
              disabled={loading}
              leftIcon={<Coins size={18} strokeWidth={1.8} />}
            />
          </Field>

          <Field
            label="Saldo inicial"
            htmlFor="account-initial-balance"
            required
            className={styles.field}
          >
            <Input
              id="account-initial-balance"
              type="number"
              value={initialBalance}
              onChange={(event) => setInitialBalance(event.target.value)}
              step="0.01"
              disabled={loading}
              leftIcon={<CircleDollarSign size={18} strokeWidth={1.8} />}
            />
          </Field>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
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

          <Button type="submit" loading={loading} disabled={loading}>
            Criar conta
          </Button>
        </div>
      </form>
    </Modal>
  );
}
