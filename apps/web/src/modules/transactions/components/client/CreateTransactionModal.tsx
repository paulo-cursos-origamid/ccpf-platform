"use client";

import { useEffect, useState } from "react";
import { Button, CurrencyInput, Field, Input, Select, Textarea } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { useAccounts } from "@/modules/accounts/hooks";
import { useCategories } from "@/modules/categories/hooks";
import { categoriesService } from "@/modules/categories/services/categories.service";
import type { SubCategory } from "@/modules/categories/types";
import { useCreditCards } from "@/modules/credit-cards/hooks";
import { creditCardsService } from "@/modules/credit-cards/services";
import { recurringBillsService } from "@/modules/recurring-bills/services/recurring-bills.service";
import { installmentPlansService } from "../../services/installment-plans.service";
import { transactionsService } from "../../services/transactions.service";
import type { CreateInstallmentPlanInput } from "../../types/installment-plan";
import type { Transaction, TransactionType } from "../../types/transaction";
import styles from "./CreateTransactionModal.module.scss";

type ExpenseRegistration = "COMMON" | "RECURRING" | "INSTALLMENT";
type InstallmentMethod = "BANK_ACCOUNT" | "CREDIT_CARD";

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
  const [amount, setAmount] = useState<number | null>(null);
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subCategoryId, setSubCategoryId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [expenseRegistration, setExpenseRegistration] =
    useState<ExpenseRegistration>("COMMON");
  const [installmentMethod, setInstallmentMethod] =
    useState<InstallmentMethod>("BANK_ACCOUNT");
  const [firstDueDate, setFirstDueDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [installmentCount, setInstallmentCount] = useState("2");
  const [creditCardId, setCreditCardId] = useState("");
  const [dueDay, setDueDay] = useState(10);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { accounts } = useAccounts();
  const { categories } = useCategories(type);
  const { cards: creditCards, loading: creditCardsLoading } = useCreditCards();
  const activeCreditCards = creditCards.filter(
    (card) => card.status === "ACTIVE",
  );
  const usesBankAccount =
    type === "INCOME" ||
    expenseRegistration !== "INSTALLMENT" ||
    installmentMethod === "BANK_ACCOUNT";

  const installmentPreview = (() => {
    const parsedTotal = amount ?? 0;
    const count = Number(installmentCount);

    if (
      !Number.isFinite(parsedTotal) ||
      parsedTotal <= 0 ||
      !Number.isInteger(count) ||
      count < (installmentMethod === "BANK_ACCOUNT" ? 2 : 1) ||
      count > 120
    ) {
      return "";
    }

    const totalCents = Math.round(parsedTotal * 100);
    const baseCents = Math.floor(totalCents / count);
    const remainder = totalCents % count;
    const firstInstallmentCents =
      baseCents +
      (installmentMethod === "CREDIT_CARD" && remainder > 0 ? 1 : 0);

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(firstInstallmentCents / 100);
  })();

  useEffect(() => {
    if (!open) return;
    setType(initialType);
    setExpenseRegistration("COMMON");
    setInstallmentMethod("BANK_ACCOUNT");
    setFirstDueDate(new Date().toISOString().slice(0, 10));
    setInstallmentCount("2");
    setCreditCardId("");
  }, [open, initialType]);

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

    const parsedAmount = amount ?? 0;

    if (!title.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Informe uma descrição e um valor válido.");
      return;
    }

    if ((usesBankAccount && !accountId) || !categoryId || !date) {
      setError("Preencha a conta, a categoria e a data.");
      return;
    }

    const parsedInstallmentCount = Number(installmentCount);
    if (type === "EXPENSE" && expenseRegistration === "INSTALLMENT") {
      const minimum = installmentMethod === "BANK_ACCOUNT" ? 2 : 1;
      if (
        !Number.isInteger(parsedInstallmentCount) ||
        parsedInstallmentCount < minimum ||
        parsedInstallmentCount > 120
      ) {
        setError(`Informe de ${minimum} a 120 parcelas.`);
        return;
      }
      if (
        installmentMethod === "BANK_ACCOUNT" &&
        (!firstDueDate || Number.isNaN(Date.parse(`${firstDueDate}T12:00:00`)))
      ) {
        setError("Informe uma data válida para o primeiro vencimento.");
        return;
      }
      if (installmentMethod === "CREDIT_CARD" && !creditCardId) {
        setError("Selecione um cartão de crédito.");
        return;
      }
    }

    setLoading(true);

    try {
      if (type === "EXPENSE" && expenseRegistration === "RECURRING") {
        await recurringBillsService.create({
          title: title.trim(),
          expectedAmount: parsedAmount.toFixed(2),
          accountId,
          categoryId,
          ...(subCategoryId ? { subCategoryId } : {}),
          frequency: "MONTHLY",
          dueDay,
          startDate: date,
          ...(description.trim() ? { description: description.trim() } : {}),
        });

        setTitle("");
        setAmount(null);
        setDescription("");
        setSubCategoryId("");
        setExpenseRegistration("COMMON");
        window.dispatchEvent(new Event("ccpf:recurring-bills-changed"));
        onClose();
        return;
      }

      if (
        type === "EXPENSE" &&
        expenseRegistration === "INSTALLMENT" &&
        installmentMethod === "BANK_ACCOUNT"
      ) {
        const plan: CreateInstallmentPlanInput = {
          title: title.trim(),
          totalAmount: parsedAmount.toFixed(2),
          accountId,
          categoryId,
          purchaseDate: date,
          firstDueDate,
          installmentCount: parsedInstallmentCount,
          ...(subCategoryId ? { subCategoryId } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
        };

        await installmentPlansService.create(plan);
        window.dispatchEvent(new Event("ccpf:financial-data-changed"));
        window.dispatchEvent(new Event("ccpf:installment-plans-changed"));
        setTitle("");
        setAmount(null);
        setDescription("");
        setSubCategoryId("");
        onClose();
        return;
      }

      if (
        type === "EXPENSE" &&
        expenseRegistration === "INSTALLMENT" &&
        installmentMethod === "CREDIT_CARD"
      ) {
        await creditCardsService.createPurchase(creditCardId, {
          title: title.trim(),
          totalAmount: parsedAmount.toFixed(2),
          purchaseDate: new Date(`${date}T12:00:00`).toISOString(),
          installmentCount: parsedInstallmentCount,
          categoryId,
          ...(subCategoryId ? { subCategoryId } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
        });
        setTitle("");
        setAmount(null);
        setDescription("");
        setSubCategoryId("");
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
      setAmount(null);
      setDescription("");
      setSubCategoryId("");
      onClose();
    } catch {
      setError(
        "Não foi possível cadastrar a transação. Confira os dados e tente novamente.",
      );
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
            onChange={(event) => {
              const nextType = event.target.value as TransactionType;
              setType(nextType);
              setCategoryId("");
              setSubCategoryId("");
              setSubCategories([]);
              if (nextType === "INCOME") setExpenseRegistration("COMMON");
            }}
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

        {type === "EXPENSE" && (
          <fieldset className={styles.expenseRegistration}>
            <legend>Como deseja registrar esta despesa?</legend>
            <div className={styles.expenseRegistrationOptions}>
              {(
                [
                  [
                    "COMMON",
                    "Despesa comum",
                    "Registrar a transação e atualizar o saldo.",
                  ],
                  [
                    "RECURRING",
                    "Conta recorrente",
                    "Planejar vencimentos e confirmar cada pagamento.",
                  ],
                  [
                    "INSTALLMENT",
                    "Compra parcelada",
                    "Planejar parcelas no cartão ou boleto/carnê.",
                  ],
                ] as const
              ).map(([value, label, descriptionText]) => (
                <label
                  key={value}
                  className={`${styles.expenseRegistrationOption} ${expenseRegistration === value ? styles.expenseRegistrationSelected : ""}`}
                >
                  <input
                    type="radio"
                    name="expense-registration"
                    value={value}
                    checked={expenseRegistration === value}
                    onChange={() => setExpenseRegistration(value)}
                    disabled={loading}
                  />
                  <span>
                    <strong>{label}</strong>
                    <small>{descriptionText}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <div className={styles.row}>
          <Field
            label={
              type === "INCOME"
                ? "Valor recebido (R$)"
                : expenseRegistration === "INSTALLMENT"
                  ? "Valor total da compra (R$)"
                  : "Valor da despesa (R$)"
            }
            htmlFor="transaction-amount"
            required
          >
            <CurrencyInput
              id="transaction-amount"
              name="amount"
              value={amount}
              onChange={setAmount}
              currency="BRL"
              placeholder="R$ 0,00"
              disabled={loading}
              required
            />
          </Field>

          <Field
            label={
              expenseRegistration === "INSTALLMENT"
                ? "Data da compra"
                : type === "INCOME"
                  ? "Data do recebimento"
                  : "Data da despesa"
            }
            htmlFor="transaction-date"
            required
          >
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

        {usesBankAccount && (
          <Field label="Conta" htmlFor="transaction-account" required>
            <Select
              id="transaction-account"
              value={accountId}
              onChange={(event) => setAccountId(event.target.value)}
              disabled={loading}
              required
            >
              <option value="">Selecione uma conta</option>
              {accounts
                .filter((account) => account.status === "ACTIVE")
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </Select>
          </Field>
        )}

        {type === "EXPENSE" && expenseRegistration === "INSTALLMENT" && (
          <fieldset className={styles.installmentMethod}>
            <legend>Modalidade da compra parcelada</legend>
            <div className={styles.installmentMethodOptions}>
              <label
                className={
                  installmentMethod === "BANK_ACCOUNT"
                    ? styles.installmentMethodSelected
                    : ""
                }
              >
                <input
                  type="radio"
                  name="installment-method"
                  value="BANK_ACCOUNT"
                  checked={installmentMethod === "BANK_ACCOUNT"}
                  onChange={() => setInstallmentMethod("BANK_ACCOUNT")}
                  disabled={loading}
                />
                Boleto / carnê
              </label>
              <label
                className={
                  installmentMethod === "CREDIT_CARD"
                    ? styles.installmentMethodSelected
                    : ""
                }
              >
                <input
                  type="radio"
                  name="installment-method"
                  value="CREDIT_CARD"
                  checked={installmentMethod === "CREDIT_CARD"}
                  onChange={() => setInstallmentMethod("CREDIT_CARD")}
                  disabled={loading}
                />
                Cartão de crédito
              </label>
            </div>
          </fieldset>
        )}

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
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
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
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {type === "EXPENSE" && expenseRegistration === "RECURRING" && (
          <div className={styles.recurringOptions}>
            <Field
              label="Dia do vencimento mensal"
              htmlFor="recurring-due-day"
              required
            >
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
              A recorrência será cadastrada sem movimentar o saldo. Confirme
              cada pagamento na lista de contas recorrentes.
            </p>
          </div>
        )}

        {type === "EXPENSE" && expenseRegistration === "INSTALLMENT" && (
          <>
            {installmentMethod === "CREDIT_CARD" ? (
              <Field
                label="Cartão de crédito"
                htmlFor="transaction-credit-card"
                required
              >
                <Select
                  id="transaction-credit-card"
                  value={creditCardId}
                  onChange={(event) => setCreditCardId(event.target.value)}
                  disabled={loading || creditCardsLoading}
                  required
                >
                  <option value="">Selecione um cartão</option>
                  {activeCreditCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name}
                      {card.lastFourDigits
                        ? ` •••• ${card.lastFourDigits}`
                        : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : (
              <Field
                label="Primeiro vencimento"
                htmlFor="installment-first-due-date"
                required
              >
                <Input
                  id="installment-first-due-date"
                  type="date"
                  value={firstDueDate}
                  onChange={(event) => setFirstDueDate(event.target.value)}
                  disabled={loading}
                  required
                />
              </Field>
            )}
            <Field
              label={
                installmentMethod === "CREDIT_CARD"
                  ? "Quantidade de parcelas (1 a 120)"
                  : "Quantidade de parcelas (2 a 120)"
              }
              htmlFor="transaction-installment-count"
              required
            >
              <Input
                id="transaction-installment-count"
                type="number"
                min={installmentMethod === "CREDIT_CARD" ? 1 : 2}
                max={120}
                step={1}
                value={installmentCount}
                onChange={(event) => setInstallmentCount(event.target.value)}
                disabled={loading}
                required
              />
            </Field>

            <Field
              label="Valor da parcela (estimado)"
              htmlFor="transaction-installment-preview"
            >
              <Input
                id="transaction-installment-preview"
                value={installmentPreview}
                readOnly
                placeholder="Informe o valor total e as parcelas"
              />
            </Field>
          </>
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
            disabled={
              loading ||
              (type === "EXPENSE" &&
                expenseRegistration === "INSTALLMENT" &&
                installmentMethod === "CREDIT_CARD" &&
                creditCardsLoading)
            }
          >
            {type === "EXPENSE" && expenseRegistration === "RECURRING"
              ? "Cadastrar recorrência"
              : type === "EXPENSE" && expenseRegistration === "INSTALLMENT"
                ? installmentMethod === "CREDIT_CARD"
                  ? "Registrar compra no cartão"
                  : "Planejar parcelas"
                : type === "INCOME"
                  ? "Salvar receita"
                  : "Salvar despesa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
