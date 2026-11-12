"use client";

import { useEffect, useState, type FormEvent } from "react";

import {
  Button,
  CurrencyInput,
  DateInput,
  Field,
  Select,
  Textarea,
} from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { AccountMemberRole } from "@/modules/accounts/types/account-member-role";
import { AccountStatus } from "@/modules/accounts/types/account-status";
import { useAccounts } from "@/modules/accounts/hooks";
import {
  usePayCreditCardInvoice,
} from "@/modules/credit-cards/hooks";
import { creditCardsService } from "@/modules/credit-cards/services/credit-cards.service";
import type {
  CreditCardInvoice,
  PayCreditCardInvoiceInput,
} from "@/modules/credit-cards/types";

import styles from "./CreditCardInvoiceDetailsModal.module.scss";

interface CreditCardInvoiceDetailsModalProps {
  open: boolean;
  invoice: CreditCardInvoice | null;
  onClose: () => void;
  onUpdated: () => Promise<unknown>;
}

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATUS_LABELS = {
  OPEN: "Aberta",
  CLOSED: "Fechada",
  PAID: "Paga",
} as const;

function localToday() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatCurrency(value: string | number) {
  const amount = Number(value);

  return money.format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value: string) {
  const datePart = value.slice(0, 10);
  const date = new Date(`${datePart}T12:00:00`);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatReferenceMonth(value: string) {
  const date = new Date(`${value.slice(0, 7)}-01T12:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function amountInCents(value: number) {
  return Number.isFinite(value) ? Math.round(value * 100) : 0;
}

function settlementCashAmount(settlement: {
  principalAmount: string;
  interestAmount: string;
  feeAmount: string;
  discountAmount: string;
}) {
  return (
    Number(settlement.principalAmount) +
    Number(settlement.interestAmount) +
    Number(settlement.feeAmount) -
    Number(settlement.discountAmount)
  );
}

export function CreditCardInvoiceDetailsModal({
  open,
  invoice,
  onClose,
  onUpdated,
}: CreditCardInvoiceDetailsModalProps) {
  const [details, setDetails] = useState<CreditCardInvoice | null>(invoice);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshError, setRefreshError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [success, setSuccess] = useState("");

  const [accountId, setAccountId] = useState("");
  const [settledAt, setSettledAt] = useState(localToday());
  const [principalAmount, setPrincipalAmount] = useState(0);
  const [interestAmount, setInterestAmount] = useState(0);
  const [feeAmount, setFeeAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [description, setDescription] = useState("");

  const {
    accounts,
    loading: accountsLoading,
    loadAccounts,
  } = useAccounts();

  const {
    payInvoice,
    loading: saving,
  } = usePayCreditCardInvoice();

  const activeAccounts = accounts.filter(
    (account) =>
      account.status === AccountStatus.ACTIVE &&
      !account.archivedAt &&
      account.role !== AccountMemberRole.VIEWER,
  );

  useEffect(() => {
    if (!open || !invoice) return;

    const invoiceId = invoice.id;
    let active = true;

    setDetails(invoice);
    setLoadingDetails(true);
    setLoadError("");
    setRefreshError("");
    setPaymentError("");
    setSuccess("");
    setSettledAt(localToday());
    setPrincipalAmount(
      Math.max(0, Number(invoice.indicators.remainingAmount) || 0),
    );
    setInterestAmount(0);
    setFeeAmount(0);
    setDiscountAmount(0);
    setDescription("");
    setAccountId("");

    async function loadDetails() {
      try {
        const result = await creditCardsService.getInvoice(invoiceId);

        if (active) {
          setDetails(result);
          setPrincipalAmount(
            Math.max(0, Number(result.indicators.remainingAmount) || 0),
          );
        }
      } catch {
        if (active) {
          setLoadError(
            "Não foi possível atualizar os detalhes. Exibindo os dados da listagem.",
          );
        }
      } finally {
        if (active) setLoadingDetails(false);
      }
    }

    void loadDetails();

    return () => {
      active = false;
    };
  }, [open, invoice]);

  useEffect(() => {
    if (!open) return;

    const accountIsAvailable = activeAccounts.some(
      (account) => account.id === accountId,
    );

    if (!accountIsAvailable) {
      setAccountId(activeAccounts[0]?.id ?? "");
    }
  }, [open, accounts, accountId]);

  const currentInvoice = details ?? invoice;

  const remainingCents = currentInvoice
    ? Math.max(
        0,
        amountInCents(Number(currentInvoice.indicators.remainingAmount)),
      )
    : 0;

  const principalCents = amountInCents(principalAmount);
  const interestCents = amountInCents(interestAmount);
  const feeCents = amountInCents(feeAmount);
  const discountCents = amountInCents(discountAmount);

  const cashMovementCents = Math.max(
    0,
    principalCents + interestCents + feeCents - discountCents,
  );

  const canPay =
    currentInvoice?.status !== "PAID" &&
    remainingCents > 0 &&
    Boolean(currentInvoice);

  async function submitPayment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentInvoice || saving) return;

    setPaymentError("");
    setRefreshError("");
    setSuccess("");

    if (!accountId || !activeAccounts.some((account) => account.id === accountId)) {
      setPaymentError("Selecione uma conta bancária ativa para o pagamento.");
      return;
    }

    if (!settledAt) {
      setPaymentError("Informe a data do pagamento.");
      return;
    }

    if (principalCents <= 0 || principalCents > remainingCents) {
      setPaymentError(
        "O principal deve ser maior que zero e não pode superar o saldo restante da fatura.",
      );
      return;
    }

    if (discountCents > principalCents) {
      setPaymentError("O desconto não pode superar o principal amortizado.");
      return;
    }

    if (
      interestCents < 0 ||
      feeCents < 0 ||
      discountCents < 0
    ) {
      setPaymentError("Informe valores válidos para juros, taxas e desconto.");
      return;
    }

    const payload: PayCreditCardInvoiceInput = {
      accountId,
      settledAt: new Date(`${settledAt}T12:00:00`).toISOString(),
      principalAmount: (principalCents / 100).toFixed(2),
      interestAmount: (interestCents / 100).toFixed(2),
      feeAmount: (feeCents / 100).toFixed(2),
      discountAmount: (discountCents / 100).toFixed(2),
      ...(description.trim()
        ? { description: description.trim() }
        : {}),
    };

    try {
      await payInvoice(currentInvoice.id, payload);
    } catch {
      setPaymentError(
        "Não foi possível registrar o pagamento. Confira os dados e tente novamente.",
      );
      return;
    }

    setSuccess("Pagamento registrado com sucesso.");
    setInterestAmount(0);
    setFeeAmount(0);
    setDiscountAmount(0);
    setDescription("");

    try {
      const updatedInvoice = await creditCardsService.getInvoice(
        currentInvoice.id,
      );

      setDetails(updatedInvoice);
      setPrincipalAmount(
        Math.max(0, Number(updatedInvoice.indicators.remainingAmount) || 0),
      );

      await Promise.allSettled([
        loadAccounts(),
        onUpdated(),
      ]);
    } catch {
      setRefreshError(
        "O pagamento foi registrado, mas não foi possível atualizar todos os dados. Reabra a fatura para consultar a situação atual.",
      );
    }
  }

  if (!currentInvoice) {
    return null;
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Detalhes da fatura"
      className={styles.modal}
      closeOnOverlayClick={!saving}
    >
      <div className={styles.content}>
        <header className={styles.invoiceHeader}>
          <div>
            <h3>{currentInvoice.creditCard.name}</h3>
            <p>
              {currentInvoice.creditCard.brand}
              {currentInvoice.creditCard.lastFourDigits
                ? ` · •••• ${currentInvoice.creditCard.lastFourDigits}`
                : ""}
            </p>
            <span className={styles.reference}>
              Fatura de {formatReferenceMonth(currentInvoice.referenceMonth)}
            </span>
          </div>

          <span
            className={`${styles.status} ${styles[`status${currentInvoice.status}`]}`}
          >
            {STATUS_LABELS[currentInvoice.status]}
          </span>
        </header>

        {loadingDetails && (
          <p className={styles.feedback}>Atualizando detalhes da fatura...</p>
        )}

        {loadError && (
          <p className={styles.warning} role="status">
            {loadError}
          </p>
        )}

        <section className={styles.summaryGrid} aria-label="Resumo da fatura">
          <div className={styles.summaryItem}>
            <span>Valor total</span>
            <strong>
              {formatCurrency(currentInvoice.indicators.totalAmount)}
            </strong>
          </div>

          <div className={styles.summaryItem}>
            <span>Valor pago</span>
            <strong>
              {formatCurrency(currentInvoice.indicators.paidAmount)}
            </strong>
          </div>

          <div className={styles.summaryItem}>
            <span>Saldo restante</span>
            <strong>
              {formatCurrency(currentInvoice.indicators.remainingAmount)}
            </strong>
          </div>

          <div className={styles.summaryItem}>
            <span>Vencimento</span>
            <strong>{formatDate(currentInvoice.dueDate)}</strong>
          </div>

          <div className={styles.summaryItem}>
            <span>Fechamento</span>
            <strong>{formatDate(currentInvoice.closingDate)}</strong>
          </div>

          <div className={styles.summaryItem}>
            <span>Compras / parcelas</span>
            <strong>
              {currentInvoice.indicators.purchaseCount} /{" "}
              {currentInvoice.indicators.installmentCount}
            </strong>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Compras e parcelas</h3>
            <span>{currentInvoice.purchases.length} compra(s)</span>
          </div>

          {currentInvoice.purchases.length === 0 ? (
            <p className={styles.empty}>Nenhuma compra nesta fatura.</p>
          ) : (
            <div className={styles.purchaseList}>
              {currentInvoice.purchases.map((purchase) => (
                <article key={purchase.id} className={styles.purchase}>
                  <div className={styles.purchaseHeader}>
                    <div>
                      <strong>{purchase.title}</strong>
                      <span>
                        Compra em {formatDate(purchase.purchaseDate)}
                      </span>
                    </div>

                    <div className={styles.purchaseAmounts}>
                      <strong>{formatCurrency(purchase.invoiceAmount)}</strong>
                      <span>
                        Total da compra: {formatCurrency(purchase.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className={styles.installments}>
                    <span className={styles.installmentHeading}>
                      {purchase.installmentCount > 1
                        ? `Parcelamento em ${purchase.installmentCount} vezes`
                        : "Compra à vista"}
                    </span>

                    {purchase.installments.map((installment) => (
                      <div
                        key={installment.id}
                        className={styles.installment}
                      >
                        <span>
                          Parcela {installment.installmentNumber}
                        </span>
                        <span>{formatDate(installment.dueDate)}</span>
                        <strong>{formatCurrency(installment.amount)}</strong>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Histórico de pagamentos</h3>
            <span>{currentInvoice.settlements.length} pagamento(s)</span>
          </div>

          {currentInvoice.settlements.length === 0 ? (
            <p className={styles.empty}>
              Ainda não existem pagamentos registrados para esta fatura.
            </p>
          ) : (
            <div className={styles.historyList}>
              {currentInvoice.settlements.map((settlement, index) => (
                <article
                  key={`${settlement.settledAt}-${index}`}
                  className={styles.historyItem}
                >
                  <div className={styles.historyHeader}>
                    <strong>Pagamento em {formatDate(settlement.settledAt)}</strong>
                    <strong>
                      {formatCurrency(settlementCashAmount(settlement))}
                    </strong>
                  </div>

                  <div className={styles.historyValues}>
                    <span>
                      Principal: {formatCurrency(settlement.principalAmount)}
                    </span>
                    <span>
                      Juros: {formatCurrency(settlement.interestAmount)}
                    </span>
                    <span>
                      Taxas: {formatCurrency(settlement.feeAmount)}
                    </span>
                    <span>
                      Desconto: {formatCurrency(settlement.discountAmount)}
                    </span>
                  </div>

                  <span className={styles.muted}>Valor movimentado</span>
                </article>
              ))}
            </div>
          )}
        </section>

        {canPay && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Registrar pagamento</h3>
              <span>Saldo: {formatCurrency(remainingCents / 100)}</span>
            </div>

            <form className={styles.form} onSubmit={submitPayment}>
              <div className={styles.formGrid}>
                <Field label="Conta de saída" htmlFor="invoice-payment-account" required>
                  <Select
                    id="invoice-payment-account"
                    value={accountId}
                    onChange={(event) => setAccountId(event.target.value)}
                    disabled={saving || accountsLoading}
                    required
                  >
                    <option value="">Selecione uma conta</option>
                    {activeAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Data do pagamento" htmlFor="invoice-payment-date" required>
                  <DateInput
                    id="invoice-payment-date"
                    value={settledAt}
                    onChange={(value) => setSettledAt(value ?? "")}
                    disabled={saving}
                    required
                  />
                </Field>

                <Field
                  label="Principal amortizado"
                  htmlFor="invoice-payment-principal"
                  helperText={`Máximo: ${formatCurrency(remainingCents / 100)}`}
                  required
                >
                  <CurrencyInput
                    id="invoice-payment-principal"
                    value={principalAmount}
                    onChange={(value) => setPrincipalAmount(value ?? 0)}
                    disabled={saving}
                    required
                  />
                </Field>

                <Field label="Juros" htmlFor="invoice-payment-interest">
                  <CurrencyInput
                    id="invoice-payment-interest"
                    value={interestAmount}
                    onChange={(value) => setInterestAmount(value ?? 0)}
                    disabled={saving}
                  />
                </Field>

                <Field label="Taxas e multas" htmlFor="invoice-payment-fee">
                  <CurrencyInput
                    id="invoice-payment-fee"
                    value={feeAmount}
                    onChange={(value) => setFeeAmount(value ?? 0)}
                    disabled={saving}
                  />
                </Field>

                <Field
                  label="Desconto"
                  htmlFor="invoice-payment-discount"
                  helperText="Reduz o saldo da fatura sem movimentar dinheiro."
                >
                  <CurrencyInput
                    id="invoice-payment-discount"
                    value={discountAmount}
                    onChange={(value) => setDiscountAmount(value ?? 0)}
                    disabled={saving}
                  />
                </Field>
              </div>

              <Field label="Observações" htmlFor="invoice-payment-description">
                <Textarea
                  id="invoice-payment-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  disabled={saving}
                  rows={2}
                  maxLength={500}
                  placeholder="Opcional"
                />
              </Field>

              <div className={styles.paymentSummary}>
                <span>Valor movimentado na conta</span>
                <strong>{formatCurrency(cashMovementCents / 100)}</strong>
              </div>

              {cashMovementCents === 0 && principalCents > 0 && (
                <p className={styles.helper}>
                  Esta liquidação não movimentará o saldo bancário, pois o
                  desconto cobre integralmente o principal informado.
                </p>
              )}

              {activeAccounts.length === 0 && !accountsLoading && (
                <p className={styles.warning}>
                  Nenhuma conta ativa com permissão para realizar pagamentos
                  está disponível.
                </p>
              )}

              {paymentError && (
                <p className={styles.error} role="alert">
                  {paymentError}
                </p>
              )}

              {success && (
                <p className={styles.success} role="status">
                  {success}
                </p>
              )}

              {refreshError && (
                <p className={styles.warning} role="status">
                  {refreshError}
                </p>
              )}

              <div className={styles.actions}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Fechar
                </Button>
                <Button
                  type="submit"
                  loading={saving}
                  disabled={
                    saving ||
                    accountsLoading ||
                    activeAccounts.length === 0
                  }
                >
                  Registrar pagamento
                </Button>
              </div>
            </form>
          </section>
        )}

        {!canPay && currentInvoice.status === "PAID" && (
          <p className={styles.success}>
            Esta fatura está totalmente paga.
          </p>
        )}
      </div>
    </Modal>
  );
}
