"use client";

import { useState } from "react";
import { Button, Field, Input, Textarea } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { useAccounts } from "@/modules/accounts/hooks";
import { transactionsService } from "../../services/transactions.service";
import styles from "./CreateTransactionModal.module.scss";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTransferModal({ open, onClose, onCreated }: Props) {
  const { accounts } = useAccounts();
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsedAmount = Number(amount.replace(",", "."));

    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
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
        ...(description.trim() ? { description: description.trim() } : {}),
      });
      setFromAccountId("");
      setToAccountId("");
      setAmount("");
      setDescription("");
      onCreated();
      onClose();
    } catch {
      setError("Não foi possível realizar a transferência. Confira as contas e o valor.");
    } finally {
      setLoading(false);
    }
  }

  const activeAccounts = accounts.filter((account) => account.status === "ACTIVE");

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title="Transferência entre contas"
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="Conta de origem" htmlFor="transfer-from" required>
          <select
            id="transfer-from"
            value={fromAccountId}
            onChange={(event) => setFromAccountId(event.target.value)}
            disabled={loading}
            required
          >
            <option value="">Selecione a conta de origem</option>
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Conta de destino" htmlFor="transfer-to" required>
          <select
            id="transfer-to"
            value={toAccountId}
            onChange={(event) => setToAccountId(event.target.value)}
            disabled={loading}
            required
          >
            <option value="">Selecione a conta de destino</option>
            {activeAccounts
              .filter((account) => account.id !== fromAccountId)
              .map((account) => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
          </select>
        </Field>

        <Field label="Valor (R$)" htmlFor="transfer-amount" required>
          <Input
            id="transfer-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="0,00"
            disabled={loading}
            required
          />
        </Field>

        <Field label="Descrição (opcional)" htmlFor="transfer-description">
          <Textarea
            id="transfer-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            rows={3}
            disabled={loading}
          />
        </Field>

        {error && <p className={styles.error} role="alert">{error}</p>}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={loading}>
            Confirmar transferência
          </Button>
        </div>
      </form>
    </Modal>
  );
}
