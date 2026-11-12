"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Button,
  CurrencyInput,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { useCategories } from "@/modules/categories/hooks";
import { useCreateCreditCardPurchase } from "@/modules/credit-cards/hooks";
import type { CreditCard, CreateCreditCardPurchaseInput } from "@/modules/credit-cards/types";

import styles from "./CreditCardPurchaseModal.module.scss";

interface CreditCardPurchaseModalProps {
  open: boolean;
  card: CreditCard | null;
  onClose: () => void;
  onSaved?: () => Promise<void> | void;
}

function getToday() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function CreditCardPurchaseModal({
  open,
  card,
  onClose,
  onSaved,
}: CreditCardPurchaseModalProps) {
  const { categories, loading: categoriesLoading } = useCategories("EXPENSE");
  const { createPurchase, loading, error } = useCreateCreditCardPurchase();

  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [purchaseDate, setPurchaseDate] = useState(getToday);
  const [installmentCount, setInstallmentCount] = useState("1");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId),
    [categories, categoryId],
  );

  const subCategories = selectedCategory?.subCategories ?? [];

  useEffect(() => {
    if (!open) return;

    setTitle("");
    setTotalAmount(null);
    setPurchaseDate(getToday());
    setInstallmentCount("1");
    setCategoryId("");
    setSubCategoryId("");
    setDescription("");
    setValidationError(null);
  }, [open, card?.id]);

  function handleClose() {
    if (!loading) onClose();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError(null);

    if (!card) {
      setValidationError("Selecione um cartão válido.");
      return;
    }

    const normalizedTitle = title.trim();
    const parsedInstallments = Number(installmentCount);

    if (normalizedTitle.length < 2 || normalizedTitle.length > 120) {
      setValidationError("A descrição deve ter entre 2 e 120 caracteres.");
      return;
    }

    if (
      totalAmount === null ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {
      setValidationError("Informe um valor válido para a compra.");
      return;
    }

    if (!purchaseDate || Number.isNaN(Date.parse(`${purchaseDate}T12:00:00`))) {
      setValidationError("Informe uma data de compra válida.");
      return;
    }

    if (
      !Number.isInteger(parsedInstallments) ||
      parsedInstallments < 1 ||
      parsedInstallments > 120
    ) {
      setValidationError("A quantidade de parcelas deve estar entre 1 e 120.");
      return;
    }

    if (!categoryId) {
      setValidationError("Selecione uma categoria de despesa.");
      return;
    }

    if (
      subCategoryId &&
      !subCategories.some((subCategory) => subCategory.id === subCategoryId)
    ) {
      setValidationError("A subcategoria selecionada não pertence à categoria.");
      return;
    }

    const data: CreateCreditCardPurchaseInput = {
      title: normalizedTitle,
      totalAmount: totalAmount.toFixed(2),
      purchaseDate: new Date(`${purchaseDate}T12:00:00`).toISOString(),
      installmentCount: parsedInstallments,
      categoryId,
      ...(subCategoryId ? { subCategoryId } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    };

    try {
      await createPurchase(card.id, data);
      await onSaved?.();
      onClose();
    } catch {
      // O erro da API é apresentado pelo estado do hook.
    }
  }

  const errorMessage =
    validationError ??
    (error instanceof Error
      ? error.message
      : error
        ? "Não foi possível registrar a compra."
        : null);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={card ? `Nova compra — ${card.name}` : "Nova compra"}
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.description}>
          Registre uma compra no cartão. As parcelas serão distribuídas nas
          faturas correspondentes, sem movimentar o saldo da conta bancária.
        </p>

        <Field label="Descrição da compra" htmlFor="credit-card-purchase-title" required>
          <Input
            id="credit-card-purchase-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex.: Compra no supermercado"
            maxLength={120}
            disabled={loading}
            autoFocus
          />
        </Field>

        <div className={styles.row}>
          <Field label="Valor total" htmlFor="credit-card-purchase-amount" required className={styles.field}>
            <CurrencyInput
              id="credit-card-purchase-amount"
              value={totalAmount}
              onChange={setTotalAmount}
              placeholder="R$ 0,00"
              disabled={loading}
            />
          </Field>

          <Field label="Data da compra" htmlFor="credit-card-purchase-date" required className={styles.field}>
            <Input
              id="credit-card-purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              disabled={loading}
            />
          </Field>
        </div>

        <div className={styles.row}>
          <Field label="Quantidade de parcelas" htmlFor="credit-card-purchase-installments" required className={styles.field}>
            <Input
              id="credit-card-purchase-installments"
              type="number"
              min={1}
              max={120}
              step={1}
              value={installmentCount}
              onChange={(event) => setInstallmentCount(event.target.value)}
              disabled={loading}
            />
          </Field>

          <Field label="Categoria de despesa" htmlFor="credit-card-purchase-category" required className={styles.field}>
            <Select
              id="credit-card-purchase-category"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setSubCategoryId("");
              }}
              disabled={loading || categoriesLoading}
            >
              <option value="">Selecione</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {subCategories.length > 0 && (
          <Field label="Subcategoria" htmlFor="credit-card-purchase-subcategory">
            <Select
              id="credit-card-purchase-subcategory"
              value={subCategoryId}
              onChange={(event) => setSubCategoryId(event.target.value)}
              disabled={loading}
            >
              <option value="">Sem subcategoria</option>
              {subCategories.map((subCategory) => (
                <option key={subCategory.id} value={subCategory.id}>
                  {subCategory.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Observação" htmlFor="credit-card-purchase-description">
          <Textarea
            id="credit-card-purchase-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Informações adicionais (opcional)"
            maxLength={500}
            rows={3}
            disabled={loading}
          />
        </Field>

        {errorMessage && (
          <div className={styles.error} role="alert">
            {errorMessage}
          </div>
        )}

        <div className={styles.actions}>
          <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={loading || categoriesLoading}>
            Registrar compra
          </Button>
        </div>
      </form>
    </Modal>
  );
}
