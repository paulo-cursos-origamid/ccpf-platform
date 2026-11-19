"use client";

import { useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { useAccounts } from "@/modules/accounts/hooks";
import { useCreditCards } from "@/modules/credit-cards/hooks";
import { creditCardsService } from "@/modules/credit-cards/services";
import type { CreditCardInvoice } from "@/modules/credit-cards/types";
import { transactionsService } from "../../services/transactions.service";
import styles from "./CreateTransactionModal.module.scss";

type TransferMode = "BETWEEN_ACCOUNTS" | "PAY_CREDIT_CARD";

/** Returns the current calendar date in local time for the payment field. */
function localToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateTransferModal({ open, onClose, onCreated }: Props) {
  const { accounts, loadAccounts } = useAccounts();
  const { cards } = useCreditCards();
  const activeCreditCards = cards.filter((card) => card.status === "ACTIVE");
  const [mode, setMode] = useState<TransferMode>("BETWEEN_ACCOUNTS");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [creditCardId, setCreditCardId] = useState("");
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [amount, setAmount] = useState("");
  const [settledAt, setSettledAt] = useState(() => localToday());
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [error, setError] = useState("");

  const selectedInvoice = invoices.find((invoice) => invoice.id === invoiceId);
  const invoiceRemaining = Number(
    selectedInvoice?.indicators.remainingAmount ?? 0,
  );

  function closeAndReset() {
    if (loading) return;
    setMode("BETWEEN_ACCOUNTS");
    setFromAccountId("");
    setToAccountId("");
    setCreditCardId("");
    setInvoices([]);
    setInvoiceId("");
    setAmount("");
    setSettledAt(localToday());
    setDescription("");
    setError("");
    onClose();
  }

  async function loadCardInvoices(cardId: string) {
    setCreditCardId(cardId);
    setInvoiceId("");
    setInvoices([]);
    setAmount("");
    setError("");
    if (!cardId) return;

    setLoadingInvoices(true);
    try {
      const [open, closed] = await Promise.all([
        creditCardsService.listInvoices({
          creditCardId: cardId,
          status: "OPEN",
          page: 1,
          limit: 100,
        }),
        creditCardsService.listInvoices({
          creditCardId: cardId,
          status: "CLOSED",
          page: 1,
          limit: 100,
        }),
      ]);
      const payableInvoices = [...open.data, ...closed.data]
        .filter((invoice) => Number(invoice.indicators.remainingAmount) > 0)
        .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
      setInvoices(payableInvoices);
    } catch {
      setError("Não foi possível carregar as faturas deste cartão.");
    } finally {
      setLoadingInvoices(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsedAmount = Number(amount.replace(",", "."));

    if (!fromAccountId) {
      setError("Selecione a conta de origem do pagamento.");
      return;
    }

    if (
      mode === "BETWEEN_ACCOUNTS" &&
      (!toAccountId || fromAccountId === toAccountId)
    ) {
      setError("Selecione contas de origem e destino diferentes.");
      return;
    }

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Informe um valor válido para a transferência.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "BETWEEN_ACCOUNTS") {
        await transactionsService.createTransfer({
          fromAccountId,
          toAccountId,
          amount: parsedAmount.toFixed(2),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
      } else {
        if (!selectedInvoice || !settledAt) {
          setError(
            "Selecione uma fatura pendente e informe a data do pagamento.",
          );
          return;
        }
        if (parsedAmount > invoiceRemaining) {
          setError("O valor não pode superar o saldo restante da fatura.");
          return;
        }

        await creditCardsService.payInvoice(selectedInvoice.id, {
          accountId: fromAccountId,
          settledAt: new Date(`${settledAt}T12:00:00`).toISOString(),
          principalAmount: parsedAmount.toFixed(2),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
        await loadAccounts();
        window.dispatchEvent(new Event("ccpf:financial-data-changed"));
      }

      setFromAccountId("");
      setToAccountId("");
      setCreditCardId("");
      setInvoices([]);
      setInvoiceId("");
      setAmount("");
      setSettledAt(localToday());
      setDescription("");
      onCreated();
      onClose();
    } catch {
      setError(
        mode === "BETWEEN_ACCOUNTS"
          ? "Não foi possível realizar a transferência. Confira as contas e o valor."
          : "Não foi possível pagar a fatura. Confira os dados e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  const activeAccounts = accounts.filter(
    (account) => account.status === "ACTIVE",
  );

  function handleModeChange(nextMode: TransferMode) {
    setMode(nextMode);
    setError("");
    setAmount("");
    setDescription("");
    if (nextMode === "BETWEEN_ACCOUNTS") {
      setCreditCardId("");
      setInvoices([]);
      setInvoiceId("");
    } else {
      setToAccountId("");
    }
  }

  return (
    <Modal
      open={open}
      onClose={closeAndReset}
      title={
        mode === "BETWEEN_ACCOUNTS" ? "Transferência" : "Pagar fatura do cartão"
      }
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <fieldset className={styles.transferModes}>
          <legend>Como deseja movimentar o valor?</legend>
          <div className={styles.transferModeOptions}>
            <label
              className={
                mode === "BETWEEN_ACCOUNTS" ? styles.transferModeSelected : ""
              }
            >
              <input
                type="radio"
                name="transfer-mode"
                checked={mode === "BETWEEN_ACCOUNTS"}
                onChange={() => handleModeChange("BETWEEN_ACCOUNTS")}
                disabled={loading}
              />
              Transferir entre contas
            </label>
            <label
              className={
                mode === "PAY_CREDIT_CARD" ? styles.transferModeSelected : ""
              }
            >
              <input
                type="radio"
                name="transfer-mode"
                checked={mode === "PAY_CREDIT_CARD"}
                onChange={() => handleModeChange("PAY_CREDIT_CARD")}
                disabled={loading}
              />
              Pagar cartão de crédito
            </label>
          </div>
        </fieldset>

        <Field label="Conta de origem" htmlFor="transfer-from" required>
          <Select
            id="transfer-from"
            className={styles.transferSelect}
            value={fromAccountId}
            onChange={(event) => setFromAccountId(event.target.value)}
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

        {mode === "BETWEEN_ACCOUNTS" ? (
          <Field label="Conta de destino" htmlFor="transfer-to" required>
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
        ) : (
          <>
            <Field
              label="Cartão de crédito"
              htmlFor="transfer-credit-card"
              required
            >
              <Select
                id="transfer-credit-card"
                className={styles.transferSelect}
                value={creditCardId}
                onChange={(event) => void loadCardInvoices(event.target.value)}
                disabled={loading || loadingInvoices}
                required
              >
                <option value="">Selecione um cartão</option>
                {activeCreditCards.map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name}
                    {card.lastFourDigits ? ` •••• ${card.lastFourDigits}` : ""}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Fatura a pagar"
              htmlFor="transfer-card-invoice"
              required
            >
              <Select
                id="transfer-card-invoice"
                className={styles.transferSelect}
                value={invoiceId}
                onChange={(event) => {
                  const nextInvoiceId = event.target.value;
                  setInvoiceId(nextInvoiceId);
                  const invoice = invoices.find(
                    (item) => item.id === nextInvoiceId,
                  );
                  setAmount(invoice?.indicators.remainingAmount ?? "");
                }}
                disabled={loading || loadingInvoices || !creditCardId}
                required
              >
                <option value="">
                  {loadingInvoices
                    ? "Carregando faturas..."
                    : "Selecione uma fatura pendente"}
                </option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {new Intl.DateTimeFormat("pt-BR", {
                      month: "long",
                      year: "numeric",
                    }).format(new Date(invoice.referenceMonth))}
                    {" · "}
                    {invoice.creditCard.name}
                    {invoice.creditCard.lastFourDigits
                      ? ` •••• ${invoice.creditCard.lastFourDigits}`
                      : ""}
                    {" · "}
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(Number(invoice.indicators.remainingAmount))}
                  </option>
                ))}
              </Select>
            </Field>
            {creditCardId && !loadingInvoices && invoices.length === 0 && (
              <p className={styles.transferHint}>
                Não há faturas pendentes para este cartão.
              </p>
            )}
          </>
        )}

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
            max={
              mode === "PAY_CREDIT_CARD" ? invoiceRemaining : undefined
            }
            required
          />
        </Field>

        {mode === "PAY_CREDIT_CARD" && (
          <>
            <Field
              label="Data do pagamento"
              htmlFor="transfer-settled-at"
              required
            >
              <Input
                id="transfer-settled-at"
                type="date"
                value={settledAt}
                onChange={(event) => setSettledAt(event.target.value)}
                disabled={loading}
                required
              />
            </Field>
            {selectedInvoice && (
              <p className={styles.transferHint}>
                Saldo restante da fatura:{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(invoiceRemaining)}
                . O pagamento reduz o saldo da conta e libera limite
                proporcionalmente.
              </p>
            )}
          </>
        )}

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

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading || loadingInvoices}
          >
            {mode === "BETWEEN_ACCOUNTS"
              ? "Confirmar transferência"
              : "Confirmar pagamento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
