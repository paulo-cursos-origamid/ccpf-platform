"use client";

import { useEffect, useState } from "react";
import { Button, Field, Input, Select, Textarea } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { useAccounts } from "@/modules/accounts/hooks";
import { useCategories } from "@/modules/categories/hooks";
import { categoriesService } from "@/modules/categories/services/categories.service";
import type { SubCategory } from "@/modules/categories/types";
import { recurringBillsService } from "@/modules/recurring-bills/services/recurring-bills.service";
import { transactionsService } from "../../services/transactions.service";
import type { Transaction, TransactionType } from "../../types/transaction";
import styles from "./CreateTransactionModal.module.scss";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (transaction: Transaction) => void;
  initialType?: TransactionType;
}

export function CreateTransactionModal({
  open,
  onClose,
  onCreated,
  initialType = "EXPENSE",
}: Props) {
  const [type, setType] = useState<TransactionType>(initialType);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [dueDay, setDueDay] = useState(10);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { accounts } = useAccounts();
  const { categories } = useCategories(type);

  useEffect(() => {
    if (open) setType(initialType);
  }, [open, initialType]);

  useEffect(() => {
    setCategoryId("");
    setSubCategoryId("");
    setSubCategories([]);
  }, [type]);

  useEffect(() => {
    let cancelled = false;

    async function loadSubCategories() {
      setSubCategories([]);
      setSubCategoryId("");

      if (!categoryId) return;

      try {
        const result = await categoriesService.listSubCategories(categoryId);
        if (!cancelled) setSubCategories(result);
      } catch {
        if (!cancelled) setSubCategories([]);
      }
    }

    void loadSubCategories();
    return () => {
      cancelled = true;
    };
  }, [categoryId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsedAmount = Number(amount.replace(",", "."));

    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Informe uma descrição e um valor válido.");
      return;
    }

    if (!accountId || !categoryId || !date) {
      setError("Preencha a conta, a categoria e a data.");
      return;
    }

    setLoading(true);

    try {
      if (type === "EXPENSE" && isRecurring) {
        await recurringBillsService.create({
          title: title.trim(),
          expectedAmount: parsedAmount.toFixed(2),
          accountId,
          categoryId,
          frequency: "MONTHLY",
          dueDay,
          startDate: new Date(`${date}T12:00:00`).toISOString(),
          ...(description.trim() ? { description: description.trim() } : {}),
        });

        setTitle("");
        setAmount("");
        setDescription("");
        setSubCategoryId("");
        setIsRecurring(false);
        window.dispatchEvent(new Event("ccpf:recurring-bills-changed"));
        onClose();
        return;
      }

      const transaction = await transactionsService.create({
        title: title.trim(),
        amount: parsedAmount.toFixed(2),
        type,
        accountId,
        categoryId,
        ...(subCategoryId ? { subCategoryId } : {}),
        date: new Date(`${date}T12:00:00`).toISOString(),
        ...(description.trim() ? { description: description.trim() } : {}),
      });

      onCreated(transaction);
      setTitle("");
      setAmount("");
      setDescription("");
      setSubCategoryId("");
      onClose();
    } catch {
      setError("Não foi possível cadastrar a transação. Confira os dados e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !loading && onClose()}
      title={type === "INCOME" ? "Nova receita" : "Nova despesa"}
      closeOnOverlayClick={!loading}
    >
      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="Tipo" htmlFor="transaction-type" required>
          <Select
            id="transaction-type"
            value={type}
            onChange={(event) => setType(event.target.value as TransactionType)}
            disabled={loading}
          >
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
          </Select>
        </Field>

        <Field label="Descrição" htmlFor="transaction-title" required>
          <Input
            id="transaction-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={160}
            placeholder="Ex.: Compra no mercado"
            disabled={loading}
            required
          />
        </Field>

        <div className={styles.row}>
          <Field label="Valor (R$)" htmlFor="transaction-amount" required>
            <Input
              id="transaction-amount"
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

          <Field label="Data" htmlFor="transaction-date" required>
            <Input
              id="transaction-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={loading}
              required
            />
          </Field>
        </div>

        <Field label="Conta" htmlFor="transaction-account" required>
          <Select
            id="transaction-account"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            disabled={loading}
            required
          >
            <option value="">Selecione uma conta</option>
            {accounts.filter((account) => account.status === "ACTIVE").map((account) => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Categoria" htmlFor="transaction-category" required>
          <Select
            id="transaction-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={loading}
            required
          >
            <option value="">Selecione uma categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </Select>
        </Field>

        {subCategories.length > 0 && (
          <Field label="Subcategoria" htmlFor="transaction-subcategory">
            <Select
              id="transaction-subcategory"
              value={subCategoryId}
              onChange={(event) => setSubCategoryId(event.target.value)}
              disabled={loading}
            >
              <option value="">Nenhuma</option>
              {subCategories.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </Select>
          </Field>
        )}

        {type === "EXPENSE" && (
          <div className={styles.recurringOptions}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(event) => setIsRecurring(event.target.checked)}
                disabled={loading}
              />
              Conta recorrente
            </label>

            {isRecurring && (
              <>
                <Field label="Dia do vencimento mensal" htmlFor="recurring-due-day" required>
                  <Input
                    id="recurring-due-day"
                    type="number"
                    min={1}
                    max={31}
                    value={dueDay}
                    onChange={(event) => setDueDay(Number(event.target.value))}
                    disabled={loading}
                    required
                  />
                </Field>
                <p>
                  A recorrência será cadastrada sem movimentar o saldo.
                  Confirme cada pagamento na lista de contas recorrentes.
                </p>
              </>
            )}
          </div>
        )}

        <Field label="Observações" htmlFor="transaction-description">
          <Textarea
            id="transaction-description"
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
            Salvar transação
          </Button>
        </div>
      </form>
    </Modal>
  );
}
