"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import QRCode from "qrcode";

import { useCreateInvoicePayment } from "../../hooks/client/useCreateInvoicePayment";
import type {
  Invoice,
  InvoiceInstallment,
  Payment,
  PaymentMethod,
} from "../../types";

import styles from "./InvoicePayment.module.scss";

import { Select } from "@/components/ui/forms/Select";
interface InvoicePaymentProps {
  invoice: Invoice;
}

export function InvoicePayment({ invoice }: InvoicePaymentProps) {
  const { payment, loading, error, createPayment, clearPayment } =
    useCreateInvoicePayment();

  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [selectedInstallmentId, setSelectedInstallmentId] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Somente parcelas em aberto podem iniciar uma tentativa de pagamento.
  const payableInstallments = (invoice.installments ?? []).filter(
    (installment) =>
      installment.status === "PENDING" || installment.status === "OVERDUE",
  );
  const selectedInstallment: InvoiceInstallment | undefined =
    payableInstallments.find(
      (installment) => installment.id === selectedInstallmentId,
    ) ?? payableInstallments[0];

  const formatCurrency = useCallback(
    (amount: number, currency: string) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency,
      }).format(amount),
    [],
  );

  const formatDate = useCallback((value: string | null) => {
    if (!value) {
      return "—";
    }

    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  }, []);

  const handleCreatePayment = async () => {
    setLocalError(null);
    setCopied(false);
    setQrCode(null);

    if (!selectedInstallment) {
      setLocalError("Esta fatura não possui parcelas em aberto para pagamento.");
      return;
    }

    const input = {
      installmentId: selectedInstallment.id,
      method,
      externalReference: `CCPF-${invoice.number}-${selectedInstallment.number}`,
      metadata: {
        invoiceNumber: invoice.number,
        installmentNumber: selectedInstallment.number,
      },
    };

    const createdPayment = await createPayment(invoice.id, input);

    if (!createdPayment) {
      return;
    }

    if (
      createdPayment.method === "PIX" &&
      createdPayment.pixCopyPaste
    ) {
      try {
        const dataUrl = await QRCode.toDataURL(
          createdPayment.pixCopyPaste,
          {
            width: 280,
            margin: 2,
            errorCorrectionLevel: "M",
          },
        );

        setQrCode(dataUrl);
      } catch {
        setLocalError(
          "O pagamento foi criado, mas não foi possível gerar o QR Code.",
        );
      }
    }
  };

  const handleCopyPix = async () => {
    const value = payment?.pixCopyPaste;

    if (!value) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      setLocalError(
        "Não foi possível copiar o código Pix automaticamente.",
      );
    }
  };

  const handleNewPaymentAttempt = () => {
    clearPayment();
    setQrCode(null);
    setCopied(false);
    setLocalError(null);
  };

  const paymentMethodLabel =
    payment?.method === "PIX" ? "Pix" : "Boleto bancário";

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Pagamento</span>
          <h2 className={styles.title}>Pagar fatura</h2>
        </div>

        <span className={styles.amount}>
          {formatCurrency(
            selectedInstallment?.amount ?? invoice.amount,
            selectedInstallment?.currency ?? invoice.currency,
          )}
        </span>
      </div>

      {!payment ? (
        <>
          {payableInstallments.length > 0 && (
            <div className={styles.formGroup}>
              <label htmlFor="invoice-installment">Parcela a pagar</label>
              <Select
                id="invoice-installment"
                value={selectedInstallment?.id ?? ""}
                onChange={(event) => setSelectedInstallmentId(event.target.value)}
                disabled={loading}
              >
                {payableInstallments.map((installment) => (
                  <option key={installment.id} value={installment.id}>
                    Parcela {installment.number}/{installment.totalCount} — {formatCurrency(installment.amount, installment.currency)}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {!selectedInstallment && (
            <div className={styles.notice} role="status">
              Esta fatura não possui parcelas em aberto para pagamento.
            </div>
          )}

          <div className={styles.methodSelector}>
            <button
              type="button"
              className={`${styles.methodButton} ${
                method === "PIX" ? styles.methodButtonActive : ""
              }`}
              onClick={() => {
                setMethod("PIX");
                setLocalError(null);
              }}
              disabled={loading}
            >
              <span className={styles.methodTitle}>Pix</span>
              <span className={styles.methodDescription}>
                Pagamento instantâneo
              </span>
            </button>

            <button
              type="button"
              className={`${styles.methodButton} ${
                method === "BANK_SLIP"
                  ? styles.methodButtonActive
                  : ""
              }`}
              onClick={() => {
                setMethod("BANK_SLIP");
                setLocalError(null);
              }}
              disabled={loading}
            >
              <span className={styles.methodTitle}>Boleto</span>
              <span className={styles.methodDescription}>
                Boleto bancário de teste
              </span>
            </button>
          </div>

          {method === "PIX" ? (
            <div className={styles.formGroup}>
              <label>Pagamento via Pix</label>

              <p className={styles.helper}>
                O backend irá gerar os dados do Pix para a parcela selecionada e exibirá o QR Code após criar a tentativa.
              </p>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label>Boleto bancário</label>

              <p className={styles.helper}>
                O backend irá gerar os dados do boleto para a parcela selecionada após criar a tentativa.
              </p>
            </div>
          )}

          {(localError || error) && (
            <div className={styles.error} role="alert">
              {localError ?? error}
            </div>
          )}

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleCreatePayment}
            disabled={loading || !selectedInstallment}
          >
            {loading
              ? "Criando pagamento..."
              : method === "PIX"
                ? "Gerar Pix de teste"
                : "Gerar boleto de teste"}
          </button>

          <p className={styles.notice}>
            Gerar o Pix ou boleto registra uma tentativa de pagamento. A fatura continuará <strong>pendente</strong> até que o pagamento seja validado e confirmado pela administração.
          </p>
        </>
      ) : (
        <PaymentCreated
          payment={payment}
          qrCode={qrCode}
          copied={copied}
          paymentMethodLabel={paymentMethodLabel}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          onCopyPix={handleCopyPix}
          onNewPaymentAttempt={handleNewPaymentAttempt}
        />
      )}
    </section>
  );
}

interface PaymentCreatedProps {
  payment: Payment;
  qrCode: string | null;
  copied: boolean;
  paymentMethodLabel: string;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (value: string | null) => string;
  onCopyPix: () => void;
  onNewPaymentAttempt: () => void;
}

/**
 * Exibe os dados da tentativa criada pela API.
 *
 * A confirmação não é realizada aqui porque pertence ao fluxo
 * administrativo da plataforma.
 */
function PaymentCreated({
  payment,
  qrCode,
  copied,
  paymentMethodLabel,
  formatCurrency,
  formatDate,
  onCopyPix,
  onNewPaymentAttempt,
}: PaymentCreatedProps) {
  return (
    <div className={styles.result}>
      <div className={styles.success}>
        <strong>Pagamento criado</strong>
        <span>
          A tentativa foi registrada, mas isso ainda não significa que a fatura foi paga. A confirmação depende da administração.
        </span>
      </div>

      <div className={styles.referenceCard}>
        <span className={styles.referenceLabel}>
          Referência do pagamento
        </span>

        <strong className={styles.reference}>
          {payment.reference}
        </strong>

        <span className={styles.referenceHint}>
          Informe esta referência ao responsável pelo financeiro.
        </span>
      </div>

      <div className={styles.summary}>
        <div>
          <span>Método</span>
          <strong>{paymentMethodLabel}</strong>
        </div>

        <div>
          <span>Valor</span>
          <strong>
            {formatCurrency(payment.amount, payment.currency)}
          </strong>
        </div>

        <div>
          <span>Status</span>
          <strong className={styles.pending}>Pendente</strong>
        </div>

        <div>
          <span>Criado em</span>
          <strong>{formatDate(payment.createdAt)}</strong>
        </div>
      </div>

      {payment.method === "PIX" && payment.pixCopyPaste && (
        <div className={styles.paymentContent}>
          <div className={styles.pixHeader}>
            <div>
              <h3>Pagamento via Pix</h3>
              <p>
                Escaneie o QR Code ou copie o código Pix copia e
                cola.
              </p>
            </div>
          </div>

          {qrCode && (
            <div className={styles.qrCodeWrapper}>
              <Image
                src={qrCode}
                alt="QR Code para pagamento via Pix"
                width={280}
                height={280}
                unoptimized
              />
            </div>
          )}

          <div className={styles.copyField}>
            <textarea
              value={payment.pixCopyPaste}
              readOnly
              rows={5}
              aria-label="Código Pix copia e cola"
            />

            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onCopyPix}
            >
              {copied ? "Código copiado" : "Copiar código Pix"}
            </button>
          </div>
        </div>
      )}

      {payment.method === "BANK_SLIP" && (
        <div className={styles.paymentContent}>
          <h3>Boleto bancário de teste</h3>

          {payment.bankSlipBarcode && (
            <div className={styles.codeBlock}>
              <span>Código de barras</span>
              <code>{payment.bankSlipBarcode}</code>
            </div>
          )}

          {payment.bankSlipDigitableLine && (
            <div className={styles.codeBlock}>
              <span>Linha digitável</span>
              <code>{payment.bankSlipDigitableLine}</code>
            </div>
          )}

          <p className={styles.notice}>
            Este boleto é um instrumento de teste. A confirmação
            ocorrerá somente através do painel administrativo.
          </p>
        </div>
      )}

      <div className={styles.pendingNotice}>
        <strong>Aguardando confirmação</strong>
        <span>
          Esta tela não confirma o pagamento. A fatura só será considerada paga depois que a administração validar e confirmar o pagamento na plataforma.
        </span>
      </div>

      <button
        type="button"
        className={styles.secondaryButton}
        onClick={onNewPaymentAttempt}
      >
        Criar outra tentativa
      </button>
    </div>
  );
}
