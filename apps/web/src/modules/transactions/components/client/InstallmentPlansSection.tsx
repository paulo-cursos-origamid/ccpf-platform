"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Button, Field, Input } from "@/components/ui/forms";
import { Modal } from "@/components/ui/overlay/Modal";
import { useAccounts } from "@/modules/accounts/hooks";
import { useCategories } from "@/modules/categories/hooks";
import { installmentPlansService } from "../../services/installment-plans.service";
import type {
  Installment,
  InstallmentPlan,
  InstallmentStatus,
} from "../../types/installment-plan";
import { CreateInstallmentPlanModal } from "./CreateInstallmentPlanModal";
import styles from "./InstallmentPlans.module.scss";

const MONEY = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const STATUS_LABEL: Record<InstallmentStatus, string> = {
  PENDING: "Pendente",
  PAID: "Paga",
  OVERDUE: "Vencida",
  CANCELED: "Cancelada",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value.slice(0, 10)}T00:00:00Z`),
  );
}

interface Props {
  createRequest?: number;
}

interface PaymentSelection {
  plan: InstallmentPlan;
  installment: Installment;
}

function PayInstallmentModal({
  selection,
  accountName,
  onClose,
  onPaid,
}: {
  selection: PaymentSelection | null;
  accountName: string;
  onClose: () => void;
  onPaid: () => void;
}) {
  const [paidDate, setPaidDate] = useState(
    () => new Date().toLocaleDateString("en-CA"),
  );
  const [saving, setSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selection || saving) return;

    setPaymentError("");
    setSaving(true);

    try {
      const paidAt = new Date(`${paidDate}T12:00:00`).toISOString();

      await installmentPlansService.pay(
        selection.plan.id,
        selection.installment.id,
        paidAt,
      );

      onPaid();
      onClose();
    } catch {
      setPaymentError(
        "Não foi possível registrar o pagamento. Verifique a parcela e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={selection !== null}
      onClose={() => {
        if (!saving) onClose();
      }}
      title="Pagar parcela"
    >
      {selection && (
        <form className={styles.form} onSubmit={submit}>
          <div className={styles.paymentSummary}>
            <strong>{selection.plan.title}</strong>
            <span>
              Parcela {selection.installment.installmentNumber}/
              {selection.plan.installmentCount}
            </span>
            <span>Conta: {accountName}</span>
            <span>
              Vencimento: {formatDate(selection.installment.dueDate)}
            </span>
            <strong>
              {MONEY.format(Number(selection.installment.amount))}
            </strong>
          </div>

          <Field label="Data do pagamento" htmlFor="installment-paid-date" required>
            <Input
              id="installment-paid-date"
              type="date"
              value={paidDate}
              onChange={(event) => setPaidDate(event.target.value)}
              disabled={saving}
              required
            />
          </Field>

          {paymentError && (
            <p className={styles.error} role="alert">
              {paymentError}
            </p>
          )}

          <div className={styles.actions}>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !paidDate}>
              {saving ? "Registrando..." : "Confirmar pagamento"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function InstallmentPlansSection({ createRequest = 0 }: Props) {
  const [plans, setPlans] = useState<InstallmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelection | null>(null);
  const { accounts } = useAccounts();
  const { categories } = useCategories("EXPENSE");

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setPlans(await installmentPlansService.list());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    if (createRequest > 0) setModalOpen(true);
  }, [createRequest]);

  const plannedTotal = useMemo(
    () =>
      plans.reduce(
        (total, plan) =>
          total +
          plan.installments
            .filter((item) => item.status !== "CANCELED")
            .reduce((sum, item) => sum + Number(item.amount), 0),
        0,
      ),
    [plans],
  );

  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.heading}>Compras parceladas</h2>
          <p className={styles.description}>
            Acompanhe suas parcelas, valores e próximos vencimentos.
          </p>
        </div>
      </header>

      {!loading && !error && plans.length > 0 && (
        <div className={styles.summary}>
          <span>Valor planejado em parcelas ativas</span>
          <strong>{MONEY.format(plannedTotal)}</strong>
          <small>{plans.length} compra(s) planejada(s)</small>
        </div>
      )}

      {loading ? (
        <p className={styles.message}>Carregando planejamentos...</p>
      ) : error ? (
        <div className={styles.message}>
          <p>Não foi possível carregar os planejamentos.</p>
          <Button type="button" variant="outline" onClick={() => void loadPlans()}>
            Tentar novamente
          </Button>
        </div>
      ) : plans.length === 0 ? (
        <div className={styles.empty}>
          <h3>Nenhuma compra parcelada</h3>
          <p>Organize suas compras em parcelas e acompanhe os vencimentos.</p>
        </div>
      ) : (
        <div className={styles.planTableWrapper}>
          <table className={styles.planTable}>
            <thead>
              <tr>
                <th>Compra</th>
                <th>Conta</th>
                <th>Categoria</th>
                <th>Data da compra</th>
                <th>Parcelas</th>
                <th>Valor total</th>
                <th>Valor da parcela</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {plans.map((plan) => {
                const account = accounts.find(
                  (item) => item.id === plan.accountId,
                );
                const category = categories.find(
                  (item) => item.id === plan.categoryId,
                );
                const isExpanded = expanded === plan.id;

                return (
                  <Fragment key={plan.id}>
                    <tr>
                      <td>
                        <strong>{plan.title}</strong>
                      </td>
                      <td>{account?.name ?? "Conta"}</td>
                      <td>{category?.name ?? "Categoria"}</td>
                      <td>{formatDate(plan.purchaseDate)}</td>
                      <td>{plan.installmentCount}</td>
                      <td className={styles.moneyCell}>
                        <strong>
                          {MONEY.format(Number(plan.totalAmount))}
                        </strong>
                      </td>
                      <td className={styles.moneyCell}>
                        {plan.installments.length > 0
                          ? MONEY.format(
                              Number(plan.installments[0].amount),
                            )
                          : "—"}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.expandButton}
                          aria-expanded={isExpanded}
                          aria-label={
                            `${isExpanded ? "Ocultar" : "Ver"} parcelas de ${plan.title}`
                          }
                          onClick={() =>
                            setExpanded(isExpanded ? null : plan.id)
                          }
                        >
                          {isExpanded
                            ? "Ocultar parcelas −"
                            : "Ver parcelas +"}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className={styles.detailsRow}>
                        <td colSpan={8}>
                          <div className={styles.details}>
                            <h3>Parcelas de {plan.title}</h3>

                            <div className={styles.installments}>
                              <table className={styles.installmentTable}>
                                <thead>
                                  <tr>
                                    <th>Parcela</th>
                                    <th>Vencimento</th>
                                    <th>Valor</th>
                                    <th>Situação</th>
                                    <th>Ações</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {plan.installments.map((item) => {
                                    const today = new Date();
                                    const todayKey = [
                                      today.getFullYear(),
                                      String(
                                        today.getMonth() + 1,
                                      ).padStart(2, "0"),
                                      String(
                                        today.getDate(),
                                      ).padStart(2, "0"),
                                    ].join("-");

                                    const isOverdue =
                                      item.status === "PENDING" &&
                                      item.dueDate.slice(0, 10) < todayKey;

                                    const status = isOverdue
                                      ? "OVERDUE"
                                      : item.status;

                                    return (
                                      <tr key={item.id}>
                                        <td>
                                          {item.installmentNumber}/
                                          {plan.installmentCount}
                                        </td>

                                        <td>
                                          {formatDate(item.dueDate)}
                                        </td>

                                        <td>
                                          {MONEY.format(
                                            Number(item.amount),
                                          )}
                                        </td>

                                        <td>
                                          <span
                                            className={`${styles.status} ${
                                              styles[
                                                status.toLowerCase()
                                              ]
                                            }`}
                                          >
                                            {STATUS_LABEL[status]}
                                          </span>
                                        </td>

                                        <td>
                                          {(item.status === "PENDING" ||
                                            item.status === "OVERDUE") && (
                                            <Button
                                              type="button"
                                              onClick={() =>
                                                setPaymentSelection({
                                                  plan,
                                                  installment: item,
                                                })
                                              }
                                            >
                                              Pagar
                                            </Button>
                                          )}

                                          {item.status === "PAID" &&
                                            "Pago"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>

            <tfoot>
              <tr>
                <td colSpan={4}>
                  <strong>Total planejado</strong>
                </td>
                <td>
                  <strong>
                    {plans.reduce(
                      (total, plan) =>
                        total + plan.installmentCount,
                      0,
                    )}
                  </strong>
                </td>
                <td className={styles.moneyCell}>
                  <strong>{MONEY.format(plannedTotal)}</strong>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}


      <p className={styles.note}>
        Os valores serão descontados do saldo da conta somente quando
        as parcelas forem pagas.
      </p>

      <CreateInstallmentPlanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => void loadPlans()}
      />

      <PayInstallmentModal
        selection={paymentSelection}
        accountName={
          accounts.find(
            (account) => account.id === paymentSelection?.plan.accountId,
          )?.name ?? "Conta financeira"
        }
        onClose={() => setPaymentSelection(null)}
        onPaid={() => {
          void loadPlans();
          window.dispatchEvent(new Event("ccpf:financial-data-changed"));
        }}
      />
    </section>
  );
}
