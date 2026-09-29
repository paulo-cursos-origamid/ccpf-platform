"use client";

import {
  FormEvent,
  useState,
} from "react";

import { CreditCard } from "@/components/icons";

import { useCreateInvoicePayment } from "../../hooks";
import type {
  PaymentMethod,
} from "../../types";

import styles from "./InvoicePayment.module.scss";

interface InvoicePaymentProps {
  invoiceId: string;
  amount: number;
  currency: string;
}

/**
 * Permite ao Tenant OWNER registrar uma tentativa de pagamento
 * para uma fatura pendente ou vencida.
 *
 * O backend continua responsável por validar a autorização,
 * o estado da fatura e os dados obrigatórios de cada método.
 */
export function InvoicePayment({
  invoiceId,
  amount,
  currency,
}: InvoicePaymentProps) {
  const {
    payment,
    loading,
    error,
    createPayment,
    clearPayment,
  } = useCreateInvoicePayment();

  const [method, setMethod] =
    useState<PaymentMethod>("PIX");
  const [pixCopyPaste, setPixCopyPaste] =
    useState("");
  const [bankSlipCode, setBankSlipCode] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const input =
      method === "PIX"
        ? {
            method,
            pixCopyPaste: pixCopyPaste.trim(),
          }
        : {
            method,
            bankSlipBarcode: bankSlipCode.trim(),
          };

    const createdPayment = await createPayment(
      invoiceId,
      input,
    );

    if (!createdPayment) {
      return;
    }

    setPixCopyPaste("");
    setBankSlipCode("");
  }

  const formattedAmount = formatCurrency(
    amount,
    currency,
  );

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.icon}>
            <CreditCard size={19} />
          </div>

          <div>
            <span className={styles.eyebrow}>
              Pagamento
            </span>

            <h2>Registrar pagamento</h2>

            <p>
              Crie uma tentativa de pagamento no valor de{" "}
              <strong>{formattedAmount}</strong>.
            </p>
          </div>
        </div>
      </header>

      {payment ? (
        <div className={styles.createdState}>
          <div className={styles.createdHeader}>
            <div>
              <span className={styles.eyebrow}>
                Tentativa criada
              </span>

              <h3>Pagamento registrado</h3>
            </div>

            <span className={styles.paymentStatus}>
              {formatPaymentStatus(payment.status)}
            </span>
          </div>

          <div className={styles.paymentGrid}>
            <PaymentItem
              label="Referência"
              value={payment.reference}
              monospace
            />

            <PaymentItem
              label="Método"
              value={formatPaymentMethod(payment.method)}
            />

            <PaymentItem
              label="Valor"
              value={formatCurrency(
                payment.amount,
                payment.currency,
              )}
            />

            <PaymentItem
              label="Criado em"
              value={formatDateTime(
                payment.createdAt,
              )}
            />
          </div>

          {payment.method === "PIX" &&
          payment.pixCopyPaste ? (
            <PaymentCode
              label="PIX Copia e Cola"
              value={payment.pixCopyPaste}
            />
          ) : null}

          {payment.method === "BANK_SLIP" &&
          payment.bankSlipBarcode ? (
            <PaymentCode
              label="Código de barras"
              value={payment.bankSlipBarcode}
            />
          ) : null}

          {payment.method === "BANK_SLIP" &&
          payment.bankSlipDigitableLine ? (
            <PaymentCode
              label="Linha digitável"
              value={payment.bankSlipDigitableLine}
            />
          ) : null}

          <div className={styles.createdActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={clearPayment}
            >
              Criar outra tentativa
            </button>
          </div>
        </div>
      ) : (
        <form
          className={styles.form}
          onSubmit={handleSubmit}
        >
          <div className={styles.methodField}>
            <span className={styles.fieldLabel}>
              Método de pagamento
            </span>

            <div className={styles.methodOptions}>
              <label
                className={`${styles.methodOption} ${
                  method === "PIX"
                    ? styles.methodOptionActive
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="PIX"
                  checked={method === "PIX"}
                  onChange={() => setMethod("PIX")}
                  disabled={loading}
                />

                <span>
                  <strong>PIX</strong>
                  <small>
                    Informe o código Copia e Cola.
                  </small>
                </span>
              </label>

              <label
                className={`${styles.methodOption} ${
                  method === "BANK_SLIP"
                    ? styles.methodOptionActive
                    : ""
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value="BANK_SLIP"
                  checked={method === "BANK_SLIP"}
                  onChange={() =>
                    setMethod("BANK_SLIP")
                  }
                  disabled={loading}
                />

                <span>
                  <strong>Boleto</strong>
                  <small>
                    Informe o código de barras ou linha
                    digitável.
                  </small>
                </span>
              </label>
            </div>
          </div>

          {method === "PIX" ? (
            <label className={styles.inputField}>
              <span className={styles.fieldLabel}>
                PIX Copia e Cola
              </span>

              <textarea
                value={pixCopyPaste}
                onChange={(event) =>
                  setPixCopyPaste(event.target.value)
                }
                placeholder="Cole aqui o código PIX"
                rows={4}
                disabled={loading}
                required
              />

              <small>
                O código será enviado ao sistema para
                registrar a tentativa de pagamento.
              </small>
            </label>
          ) : (
            <label className={styles.inputField}>
              <span className={styles.fieldLabel}>
                Código de barras ou linha digitável
              </span>

              <input
                type="text"
                value={bankSlipCode}
                onChange={(event) =>
                  setBankSlipCode(event.target.value)
                }
                placeholder="Digite ou cole o código"
                disabled={loading}
                required
              />

              <small>
                Informe pelo menos um dos códigos exigidos
                para o boleto.
              </small>
            </label>
          )}

          {error ? (
            <div className={styles.feedbackError}>
              <strong>
                Não foi possível criar o pagamento.
              </strong>

              <span>{error}</span>
            </div>
          ) : null}

          <div className={styles.formFooter}>
            <span>
              O pagamento será criado com status
              <strong> Pendente</strong>.
            </span>

            <button
              type="submit"
              className={styles.primaryButton}
              disabled={loading}
            >
              {loading
                ? "Registrando..."
                : "Registrar pagamento"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

interface PaymentItemProps {
  label: string;
  value: string;
  monospace?: boolean;
}

function PaymentItem({
  label,
  value,
  monospace = false,
}: PaymentItemProps) {
  return (
    <div className={styles.paymentItem}>
      <span>{label}</span>

      <strong
        className={
          monospace ? styles.monospace : undefined
        }
      >
        {value}
      </strong>
    </div>
  );
}

function PaymentCode({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={styles.codeBlock}>
      <span>{label}</span>

      <code>{value}</code>
    </div>
  );
}

function formatPaymentMethod(
  method: PaymentMethod,
): string {
  return method === "PIX" ? "PIX" : "Boleto";
}

function formatPaymentStatus(
  status: string,
): string {
  switch (status) {
    case "PENDING":
      return "Pendente";
    case "PROCESSING":
      return "Processando";
    case "PAID":
      return "Pago";
    case "FAILED":
      return "Falhou";
    case "REFUNDED":
      return "Estornado";
    case "CANCELLED":
      return "Cancelado";
    default:
      return status;
  }
}

function formatCurrency(
  value: number,
  currency: string,
): string {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

function formatDateTime(
  date: string,
): string {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(parsedDate);
}
