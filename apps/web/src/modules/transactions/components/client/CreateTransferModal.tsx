"use client";

import { useState, type FormEvent } from "react";
import {
  Button,
  CurrencyInput,
  Field,
  Select,
  Textarea,
} from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { useAccounts } from "@/modules/accounts/hooks";
import { transactionsService } from "../../services/transactions.service";
import styles from "./CreateTransactionModal.module.scss";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTransferModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const { accounts } = useAccounts();

  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activeAccounts = accounts.filter(
    (account) => account.status === "ACTIVE",
  );

  function closeAndReset() {
    if (loading) return;

    setFromAccountId("");
    setToAccountId("");
    setAmount(null);
    setDescription("");
    setError("");

    onClose();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsedAmount = amount ?? 0;

    if (!fromAccountId) {
      setError("Selecione a conta de origem da transferência.");
      return;
    }

    if (!toAccountId || fromAccountId === toAccountId) {
      setError("Selecione contas de origem e destino diferentes.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Informe um valor válido para a transferência.");
      return;
    }

    setLoading(true);

    try {
      await transactionsService.createTransfer({
        fromAccountId,
        toAccountId,
        amount: parsedAmount.toFixed(2),
        ...(description.trim()
          ? { description: description.trim() }
          : {}),
      });

      setFromAccountId("");
      setToAccountId("");
      setAmount(null);
      setDescription("");
      setError("");

      onCreated();
      onClose();
    } catch {
      setError(
        "Não foi possível realizar a transferência. Confira as contas e o valor.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={closeAndReset}
      title="Transferência"
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field
          label="Conta de origem"
          htmlFor="transfer-from"
          required
        >
          <Select
            id="transfer-from"
            className={styles.transferSelect}
            value={fromAccountId}
            onChange={(event) => {
              setFromAccountId(event.target.value);

              if (event.target.value === toAccountId) {
                setToAccountId("");
              }
            }}
            disabled={loading}
            required
          >
            <option value="">Selecione a conta de origem</option>

            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Conta de destino"
          htmlFor="transfer-to"
          required
        >
          <Select
            id="transfer-to"
            className={styles.transferSelect}
            value={toAccountId}
            onChange={(event) => setToAccountId(event.target.value)}
            disabled={loading}
            required
          >
            <option value="">Selecione a conta de destino</option>

            {activeAccounts
              .filter((account) => account.id !== fromAccountId)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </Select>
        </Field>

        <Field
          label="Valor (R$)"
          htmlFor="transfer-amount"
          required
        >
          <CurrencyInput
            id="transfer-amount"
            name="amount"
            value={amount}
            onChange={setAmount}
            currency="BRL"
            placeholder="R$ 0,00"
            disabled={loading}
            required
          />
        </Field>

        <Field
          label="Descrição (opcional)"
          htmlFor="transfer-description"
        >
          <Textarea
            id="transfer-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={3}
            disabled={loading}
          />
        </Field>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={closeAndReset}
            disabled={loading}
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
          >
            Confirmar transferência
          </Button>
        </div>
      </form>
    </Modal>
  );
}
