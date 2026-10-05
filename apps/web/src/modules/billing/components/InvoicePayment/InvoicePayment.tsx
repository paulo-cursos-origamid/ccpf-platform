"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import QRCode from "qrcode";

import { useCreateInvoicePayment } from "../../hooks/client/useCreateInvoicePayment";
import type {
  Invoice,
  Payment,
  PaymentMethod,
} from "../../types";

import styles from "./InvoicePayment.module.scss";

interface InvoicePaymentProps {
  invoice: Invoice;
}

/**
 * Formata um campo no padrão TLV utilizado pelo payload Pix EMV.
 *
 * Estrutura:
 * ID + tamanho + valor.
 */
function pixField(id: string, value: string): string {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

/**
 * Calcula o CRC16-CCITT utilizado no payload Pix.
 *
 * A função recebe o payload sem o campo de CRC e acrescenta
 * "6304" antes de calcular o valor final.
 */
function calculatePixCrc16(payload: string): string {
  let crc = 0xffff;

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Gera um payload Pix mock para o ambiente de testes.
 *
 * O payload é estruturalmente compatível com o formato EMV/Pix,
 * mas não representa uma cobrança bancária real.
 *
 * O valor da Invoice é incorporado ao campo 54 e o identificador
 * da Invoice é utilizado para criar um TXID determinístico.
 */
function generateMockPixPayload(invoice: Invoice): string {
  const amount = invoice.amount.toFixed(2);

  const transactionId =
    invoice.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20) || "CCPFTEST";

  const merchantAccountInformation = [
    pixField("00", "BR.GOV.BCB.PIX"),
    pixField("01", "pix@ccpf.test"),
  ].join("");

  const payloadWithoutCrc = [
    pixField("00", "01"),
    pixField("26", merchantAccountInformation),
    pixField("52", "0000"),
    pixField("53", "986"),
    pixField("54", amount),
    pixField("58", "BR"),
    pixField("59", "CCPF"),
    pixField("60", "SUMARE"),
    pixField(
      "62",
      pixField("05", transactionId),
    ),
    "6304",
  ].join("");

  return `${payloadWithoutCrc}${calculatePixCrc16(payloadWithoutCrc)}`;
}

/**
 * Gera um código de barras mock de 44 dígitos para testes.
 *
 * Não representa um boleto bancário emitido por instituição financeira.
 * O objetivo é apenas exercitar o fluxo de criação de Payment no CCPF.
 */
function generateMockBankSlipBarcode(invoice: Invoice): string {
  const amountInCents = Math.round(invoice.amount * 100)
    .toString()
    .padStart(10, "0");

  const invoiceDigits =
    invoice.id.replace(/\D/g, "").padStart(20, "0").slice(-20);

  const base = `0019${amountInCents}${invoiceDigits}`;

  let hash = 0;

  for (let index = 0; index < invoice.id.length; index += 1) {
    hash = (hash * 31 + invoice.id.charCodeAt(index)) % 100000000;
  }

  return `${base}${hash.toString().padStart(8, "0")}`.slice(0, 44);
}

/**
 * Componente responsável por iniciar uma tentativa de pagamento
 * de uma Invoice pelo Tenant OWNER.
 *
 * O componente gera instrumentos de pagamento mock para o ambiente
 * de testes e os envia para a API através do fluxo oficial de Billing.
 *
 * A confirmação não ocorre neste componente.
 * Ela permanece exclusivamente no painel administrativo.
 */
export function InvoicePayment({ invoice }: InvoicePaymentProps) {
  const { payment, loading, error, createPayment, clearPayment } =
    useCreateInvoicePayment();

  const [method, setMethod] = useState<PaymentMethod>("PIX");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

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

    const generatedPix =
      method === "PIX"
        ? generateMockPixPayload(invoice)
        : undefined;

    const generatedBankSlip =
      method === "BANK_SLIP"
        ? generateMockBankSlipBarcode(invoice)
        : undefined;

    const input =
      method === "PIX"
        ? {
            method,
            pixCopyPaste: generatedPix,
            externalReference: `MOCK-PIX-${invoice.number}`,
            metadata: {
              mock: true,
              environment: "development",
              generatedBy: "CCPF_TEST_CHECKOUT",
              invoiceNumber: invoice.number,
            },
          }
        : {
            method,
            bankSlipBarcode: generatedBankSlip,
            externalReference: `MOCK-BOLETO-${invoice.number}`,
            metadata: {
              mock: true,
              environment: "development",
              generatedBy: "CCPF_TEST_CHECKOUT",
              invoiceNumber: invoice.number,
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
          <h2 className={styles.title}>Pagar esta invoice</h2>
        </div>

        <span className={styles.amount}>
          {formatCurrency(invoice.amount, invoice.currency)}
        </span>
      </div>

      {!payment ? (
        <>
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
                O sistema irá gerar automaticamente um Pix mock
                utilizando o valor desta Invoice e exibirá o QR Code
                após a criação da tentativa de pagamento.
              </p>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label>Boleto bancário</label>

              <p className={styles.helper}>
                O sistema irá gerar automaticamente um código de
                boleto mock para esta Invoice.
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
            disabled={loading}
          >
            {loading
              ? "Criando pagamento..."
              : method === "PIX"
                ? "Gerar Pix de teste"
                : "Gerar boleto de teste"}
          </button>

          <p className={styles.notice}>
            O pagamento será criado como{" "}
            <strong>pendente</strong> e dependerá de confirmação
            administrativa.
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
          A tentativa foi registrada e aguarda confirmação.
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
          Esta tela não confirma o pagamento. Depois que o
          responsável financeiro validar o pagamento, a Invoice
          poderá ser marcada como paga pela plataforma.
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
