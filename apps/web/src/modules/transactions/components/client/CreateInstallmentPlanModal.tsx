"use client";

import { useEffect, useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { useAccounts } from "@/modules/accounts/hooks";
import { useCategories } from "@/modules/categories/hooks";
import { categoriesService } from "@/modules/categories/services/categories.service";
import type { SubCategory } from "@/modules/categories/types/category";
import { installmentPlansService } from "../../services/installment-plans.service";
import type { CreateInstallmentPlanInput } from "../../types/installment-plan";
import styles from "./InstallmentPlans.module.scss";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateInstallmentPlanModal({ open, onClose, onCreated }: Props) {
  const { accounts } = useAccounts();
  const { categories } = useCategories("EXPENSE");

  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(today());
  const [firstDueDate, setFirstDueDate] = useState(today());
  const [installmentCount, setInstallmentCount] = useState("2");
  const [description, setDescription] = useState("");
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!categoryId) {
      setSubCategories([]);
      setSubCategoryId("");
      return;
    }

    let active = true;

    categoriesService
      .listSubCategories(categoryId)
      .then((items) => {
        if (active) setSubCategories(items);
      })
      .catch(() => {
        if (active) setSubCategories([]);
      });

    return () => {
      active = false;
    };
  }, [categoryId]);

  useEffect(() => {
    if (!open) return;
    setError("");
  }, [open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const amount = Number(totalAmount.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Informe um valor total válido.");
      return;
    }

    const payload: CreateInstallmentPlanInput = {
      title: title.trim(),
      totalAmount: amount.toFixed(2),
      accountId,
      categoryId,
      purchaseDate,
      firstDueDate,
      installmentCount: Number(installmentCount),
      ...(subCategoryId ? { subCategoryId } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    };

    setLoading(true);
    try {
      await installmentPlansService.create(payload);
      onCreated();
      onClose();
      setTitle("");
      setTotalAmount("");
      setDescription("");
      setSubCategoryId("");
    } catch {
      setError("Não foi possível salvar o planejamento. Confira os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Planejar compra parcelada">
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="Descrição da compra" htmlFor="plan-title" required>
          <Input
            id="plan-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={120}
            placeholder="Ex.: Notebook"
          />
        </Field>

        <Field label="Valor total (R$)" htmlFor="plan-total" required>
          <Input
            id="plan-total"
            inputMode="decimal"
            value={totalAmount}
            onChange={(event) => setTotalAmount(event.target.value)}
            required
            placeholder="0,00"
          />
        </Field>

        <Field label="Conta" htmlFor="plan-account" required>
          <Select
            id="plan-account"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            required
          >
            <option value="">Selecione uma conta</option>
            {accounts
              .filter((account) => account.status === "ACTIVE" && !account.archivedAt)
              .map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
          </Select>
        </Field>

        <Field label="Categoria de despesa" htmlFor="plan-category" required>
          <Select
            id="plan-category"
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setSubCategoryId("");
            }}
            required
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>

        {subCategories.length > 0 && (
          <Field label="Subcategoria" htmlFor="plan-subcategory">
            <Select
              id="plan-subcategory"
              value={subCategoryId}
              onChange={(event) => setSubCategoryId(event.target.value)}
            >
              <option value="">Sem subcategoria</option>
              {subCategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className={styles.formGrid}>
          <Field label="Data da compra" htmlFor="plan-purchase-date" required>
            <Input
              id="plan-purchase-date"
              type="date"
              value={purchaseDate}
              onChange={(event) => setPurchaseDate(event.target.value)}
              required
            />
          </Field>

          <Field label="Primeiro vencimento" htmlFor="plan-first-due" required>
            <Input
              id="plan-first-due"
              type="date"
              value={firstDueDate}
              onChange={(event) => setFirstDueDate(event.target.value)}
              required
            />
          </Field>
        </div>

        <Field label="Quantidade de parcelas" htmlFor="plan-count" required>
          <Select
            id="plan-count"
            value={installmentCount}
            onChange={(event) => setInstallmentCount(event.target.value)}
            required
          >
            {Array.from({ length: 119 }, (_, index) => index + 2).map((count) => (
              <option key={count} value={count}>
                {count} parcelas
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Observações" htmlFor="plan-description">
          <Textarea
            id="plan-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Opcional"
          />
        </Field>

        <p className={styles.helper}>
          O planejamento não lança transações nem altera o saldo da conta.
        </p>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" loading={loading} disabled={loading}>
            Salvar planejamento
          </Button>
        </div>
      </form>
    </Modal>
  );
}
