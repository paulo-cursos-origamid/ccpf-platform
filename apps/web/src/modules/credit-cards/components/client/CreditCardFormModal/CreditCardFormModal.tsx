"use client";

import { useEffect, useState } from "react";

import { Button, CurrencyInput, Field, Input, Select } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";

import {
  useCreateCreditCard,
  useUpdateCreditCard,
} from "@/modules/credit-cards/hooks";
import type {
  CreditCard,
  CreditCardBrand,
  CreateCreditCardInput,
} from "@/modules/credit-cards/types";

import styles from "./CreditCardFormModal.module.scss";

interface CreditCardFormModalProps {
  open: boolean;
  card?: CreditCard | null;
  onClose: () => void;
  onSaved?: (card: CreditCard) => Promise<void> | void;
}

const BRAND_OPTIONS: Array<{ value: CreditCardBrand; label: string }> = [
  { value: "VISA", label: "Visa" },
  { value: "MASTERCARD", label: "Mastercard" },
  { value: "ELO", label: "Elo" },
  { value: "AMEX", label: "American Express" },
  { value: "HIPERCARD", label: "Hipercard" },
  { value: "OTHER", label: "Outra" },
];

export function CreditCardFormModal({
  open,
  card,
  onClose,
  onSaved,
}: CreditCardFormModalProps) {
  const { createCreditCard, loading: creating, error: createError } =
    useCreateCreditCard();
  const { updateCreditCard, loading: updating, error: updateError } =
    useUpdateCreditCard();

  const loading = creating || updating;
  const [name, setName] = useState("");
  const [brand, setBrand] = useState<CreditCardBrand>("VISA");
  const [lastFourDigits, setLastFourDigits] = useState("");
  const [creditLimit, setCreditLimit] = useState<number | null>(null);
  const [closingDay, setClosingDay] = useState("1");
  const [dueDay, setDueDay] = useState("10");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setName(card?.name ?? "");
    setBrand(card?.brand ?? "VISA");
    setLastFourDigits(card?.lastFourDigits ?? "");
    setCreditLimit(card?.creditLimit ?? null);
    setClosingDay(String(card?.closingDay ?? 1));
    setDueDay(String(card?.dueDay ?? 10));
    setValidationError(null);
  }, [open, card]);

  function handleClose() {
    if (!loading) onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    const normalizedName = name.trim();
    const parsedClosingDay = Number(closingDay);
    const parsedDueDay = Number(dueDay);

    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setValidationError("O nome deve ter entre 2 e 100 caracteres.");
      return;
    }

    if (lastFourDigits && !/^\d{4}$/.test(lastFourDigits)) {
      setValidationError("Informe exatamente quatro dígitos ou deixe o campo vazio.");
      return;
    }

    if (creditLimit === null || !Number.isFinite(creditLimit) || creditLimit <= 0) {
      setValidationError("Informe um limite de crédito válido.");
      return;
    }

    if (
      !Number.isInteger(parsedClosingDay) ||
      parsedClosingDay < 1 ||
      parsedClosingDay > 31 ||
      !Number.isInteger(parsedDueDay) ||
      parsedDueDay < 1 ||
      parsedDueDay > 31
    ) {
      setValidationError("Os dias de fechamento e vencimento devem estar entre 1 e 31.");
      return;
    }

    const data: CreateCreditCardInput = {
      name: normalizedName,
      brand,
      lastFourDigits: lastFourDigits || null,
      creditLimit,
      closingDay: parsedClosingDay,
      dueDay: parsedDueDay,
    };

    try {
      const savedCard = card
        ? await updateCreditCard(card.id, data)
        : await createCreditCard(data);

      await onSaved?.(savedCard);
      onClose();
    } catch {
      // O erro da API é apresentado pelo estado do hook.
    }
  }

  const apiError = createError || updateError;
  const errorMessage =
    validationError ??
    (apiError instanceof Error
      ? apiError.message
      : apiError
        ? "Não foi possível salvar o cartão."
        : null);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={card ? "Editar cartão" : "Novo cartão"}
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.description}>
          {card
            ? "Atualize os dados cadastrais do cartão."
            : "Cadastre um cartão de crédito para acompanhar suas faturas e compras."}
        </p>

        <Field label="Nome do cartão" htmlFor="credit-card-name" required>
          <Input
            id="credit-card-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex.: Cartão principal"
            disabled={loading}
            autoFocus
            maxLength={100}
          />
        </Field>

        <div className={styles.row}>
          <Field label="Bandeira" htmlFor="credit-card-brand" required className={styles.field}>
            <Select
              id="credit-card-brand"
              value={brand}
              onChange={(event) => setBrand(event.target.value as CreditCardBrand)}
              disabled={loading}
            >
              {BRAND_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Últimos 4 dígitos" htmlFor="credit-card-digits" className={styles.field}>
            <Input
              id="credit-card-digits"
              value={lastFourDigits}
              onChange={(event) =>
                setLastFourDigits(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="0000"
              inputMode="numeric"
              maxLength={4}
              disabled={loading}
            />
          </Field>
        </div>

        <Field label="Limite de crédito" htmlFor="credit-card-limit" required>
          <CurrencyInput
            id="credit-card-limit"
            value={creditLimit}
            onChange={setCreditLimit}
            placeholder="R$ 0,00"
            disabled={loading}
          />
        </Field>

        <div className={styles.row}>
          <Field label="Dia de fechamento" htmlFor="credit-card-closing-day" required className={styles.field}>
            <Input
              id="credit-card-closing-day"
              type="number"
              min={1}
              max={31}
              value={closingDay}
              onChange={(event) => setClosingDay(event.target.value)}
              disabled={loading}
            />
          </Field>

          <Field label="Dia de vencimento" htmlFor="credit-card-due-day" required className={styles.field}>
            <Input
              id="credit-card-due-day"
              type="number"
              min={1}
              max={31}
              value={dueDay}
              onChange={(event) => setDueDay(event.target.value)}
              disabled={loading}
            />
          </Field>
        </div>

        {errorMessage && (
          <div className={styles.error} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={loading}>
            {card ? "Salvar alterações" : "Cadastrar cartão"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
