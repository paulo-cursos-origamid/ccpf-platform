"use client";

import { useState, type FormEvent } from "react";

import {
  CalendarDays,
  CircleDollarSign,
  Lock,
  Plus,
  Unlock,
} from "@/components/icons";
import { useAccounts } from "@/modules/accounts/hooks";
import type { Account } from "@/modules/accounts/types";

import { useFinancialGoals } from "../../../hooks";
import { financialGoalsService } from "../../../services/financial-goals.service";
import type { FinancialGoalListItem } from "../../../types";

import styles from "./ListFinancialGoals.module.scss";

const STATUS_LABELS = {
  ACTIVE: "Em andamento",
  COMPLETED: "Concluída",
  ARCHIVED: "Arquivada",
} as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "Sem prazo definido";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

function GoalCard({
  item,
  onContribution,
  onLock,
  onRestore,
}: {
  item: FinancialGoalListItem;
  onContribution: (goal: FinancialGoalListItem) => void;
  onLock: (goal: FinancialGoalListItem) => void;
  onRestore: (goal: FinancialGoalListItem) => void;
}) {
  const { goal, progress, effectiveStatus } = item;
  const percentage = Math.min(Math.max(progress.percentage, 0), 100);

  return (
    <article className={styles.goalCard}>
      <header className={styles.cardHeader}>
        <div className={styles.goalIdentity}>
          <span className={styles.goalIcon}>
            <CircleDollarSign size={19} />
          </span>
          <div>
            <h2>{goal.name}</h2>
            <span
              className={`${styles.status} ${styles[effectiveStatus.toLowerCase()]}`}
            >
              {STATUS_LABELS[effectiveStatus]}
            </span>
          </div>
        </div>

        {effectiveStatus === "ACTIVE" && (
          <button
            type="button"
            className={styles.iconButton}
            title="Arquivar meta"
            aria-label={`Arquivar meta ${goal.name}`}
            onClick={() => onLock(item)}
          >
            <Lock size={17} />
          </button>
        )}
        {effectiveStatus === "ARCHIVED" && (
          <button
            type="button"
            className={styles.iconButton}
            title="Desarquivar meta"
            aria-label={`Desarquivar meta ${goal.name}`}
            onClick={() => onRestore(item)}
          >
            <Unlock size={17} />
          </button>
        )}
      </header>

      {goal.description && (
        <p className={styles.description}>{goal.description}</p>
      )}

      <div className={styles.progressSection}>
        <div
          className={styles.donut}
          style={{
            background: `conic-gradient(var(--accent-primary) ${percentage * 3.6}deg, var(--border-primary) 0deg)`,
          }}
          role="img"
          aria-label={`${percentage.toFixed(1)}% concluído`}
        >
          <div className={styles.donutCenter}>
            <strong>{percentage.toFixed(0)}%</strong>
            <span>alcançado</span>
          </div>
        </div>

        <div className={styles.amounts}>
          <span className={styles.amountLabel}>Valor acumulado</span>
          <strong className={styles.accumulated}>
            {formatCurrency(progress.totalAmount)}
          </strong>
          <span className={styles.amountLabel}>
            Meta: {formatCurrency(goal.targetAmount)}
          </span>
          <div className={styles.progressTrack}>
            <span style={{ width: `${percentage}%` }} />
          </div>
          <div className={styles.remaining}>
            <span>Restante</span>
            <strong>{formatCurrency(progress.remainingAmount)}</strong>
          </div>
        </div>
      </div>

      <footer className={styles.cardFooter}>
        <span>
          <CalendarDays size={15} /> {formatDate(goal.targetDate)}
        </span>
        {effectiveStatus === "ACTIVE" && (
          <button
            type="button"
            className={styles.contributionButton}
            onClick={() => onContribution(item)}
          >
            <Plus size={16} /> Registrar aporte
          </button>
        )}
      </footer>
    </article>
  );
}

export function ListFinancialGoals() {
  const { goals, loading, error, loadGoals } = useFinancialGoals();
  const { accounts } = useAccounts();

  const [createOpen, setCreateOpen] = useState(false);
  const [contributionGoal, setContributionGoal] =
    useState<FinancialGoalListItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const activeGoals = goals.filter((item) => item.effectiveStatus === "ACTIVE");
  const totalSaved = goals.reduce(
    (sum, item) => sum + item.progress.totalAmount,
    0,
  );
  const totalCircleDollarSign = activeGoals.reduce(
    (sum, item) => sum + item.goal.targetAmount,
    0,
  );

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const targetAmount = Number(
      String(form.get("targetAmount") ?? "").replace(",", "."),
    );
    const targetDate = String(form.get("targetDate") ?? "");
    const linkedAccountId = String(form.get("linkedAccountId") ?? "");

    if (!name || !Number.isFinite(targetAmount) || targetAmount <= 0) {
      setFormError("Informe um nome e um valor-alvo válido.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await financialGoalsService.create({
        name,
        targetAmount,
        ...(description ? { description } : {}),
        ...(targetDate ? { targetDate } : {}),
        ...(linkedAccountId ? { linkedAccountId } : {}),
      });
      setCreateOpen(false);
      await loadGoals();
    } catch {
      setFormError(
        "Não foi possível criar a meta. Verifique os dados e tente novamente.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleContribution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contributionGoal) return;

    const form = new FormData(event.currentTarget);
    const amount = Number(String(form.get("amount") ?? "").replace(",", "."));
    const date = String(form.get("date") ?? "");
    const description = String(form.get("description") ?? "").trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Informe um valor de aporte válido.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await financialGoalsService.addContribution(contributionGoal.goal.id, {
        amount,
        ...(date ? { date } : {}),
        ...(description ? { description } : {}),
      });
      setContributionGoal(null);
      await loadGoals();
    } catch {
      setFormError("Não foi possível registrar o aporte.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLock(item: FinancialGoalListItem) {
    if (!window.confirm(`Deseja arquivar a meta "${item.goal.name}"?`)) return;

    try {
      await financialGoalsService.archive(item.goal.id);
      await loadGoals();
    } catch {
      setFormError("Não foi possível arquivar a meta.");
    }
  }

  async function handleRestore(item: FinancialGoalListItem) {
    if (!window.confirm(`Deseja desarquivar a meta "${item.goal.name}"?`))
      return;

    try {
      await financialGoalsService.restore(item.goal.id);
      await loadGoals();
    } catch {
      setFormError("Não foi possível desarquivar a meta.");
    }
  }

  if (loading) {
    return (
      <section className={styles.container}>
        <div className={styles.feedback}>Carregando metas financeiras...</div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={styles.container}>
        <div className={styles.feedback}>
          <p>Não foi possível carregar as metas financeiras.</p>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void loadGoals()}
          >
            Tentar novamente
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Metas financeiras</h1>
          <p className={styles.subtitle}>
            Planeje seus objetivos e acompanhe cada conquista.
          </p>
        </div>

        <button
          type="button"
          className={styles.addButton}
          onClick={() => {
            setFormError("");
            setCreateOpen(true);
          }}
        >
          <Plus size={18} /> Nova meta
        </button>
      </header>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span>Metas em andamento</span>
          <strong>{activeGoals.length}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Total acumulado</span>
          <strong>{formatCurrency(totalSaved)}</strong>
        </div>
        <div className={styles.summaryCard}>
          <span>Alvo das metas ativas</span>
          <strong>{formatCurrency(totalCircleDollarSign)}</strong>
        </div>
      </div>

      {formError && (
        <p className={styles.formError} role="alert">
          {formError}
        </p>
      )}

      {goals.length === 0 ? (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>
            <CircleDollarSign size={28} />
          </span>
          <h2>Comece sua primeira meta</h2>
          <p>
            Defina um objetivo financeiro e acompanhe seu progresso até
            conquistá-lo.
          </p>
          <button
            type="button"
            className={styles.addButton}
            onClick={() => setCreateOpen(true)}
          >
            <Plus size={18} /> Criar primeira meta
          </button>
        </div>
      ) : (
        <div className={styles.goalGrid}>
          {goals.map((item) => (
            <GoalCard
              key={item.goal.id}
              item={item}
              onContribution={(goal) => {
                setFormError("");
                setContributionGoal(goal);
              }}
              onLock={handleLock}
              onRestore={handleRestore}
            />
          ))}
        </div>
      )}

      {createOpen && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving)
              setCreateOpen(false);
          }}
        >
          <form className={styles.modal} onSubmit={handleCreate}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Nova meta financeira</h2>
                <p>Defina o objetivo que deseja alcançar.</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setCreateOpen(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <label>
              Nome da meta
              <input
                name="name"
                required
                minLength={2}
                maxLength={100}
                placeholder="Ex.: Viagem de férias"
              />
            </label>
            <label>
              Valor-alvo
              <input
                name="targetAmount"
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
              />
            </label>
            <label>
              Descrição
              <textarea
                name="description"
                maxLength={500}
                rows={3}
                placeholder="Descreva seu objetivo (opcional)"
              />
            </label>
            <label>
              Data-alvo
              <input name="targetDate" type="date" />
            </label>
            <label>
              Conta vinculada (opcional)
              <select name="linkedAccountId" defaultValue="">
                <option value="">Nenhuma conta vinculada</option>
                {accounts
                  .filter((account: Account) => account.status === "ACTIVE")
                  .map((account: Account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
              </select>
            </label>

            {formError && <p className={styles.formError}>{formError}</p>}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setCreateOpen(false)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.addButton}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Criar meta"}
              </button>
            </div>
          </form>
        </div>
      )}

      {contributionGoal && (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving)
              setContributionGoal(null);
          }}
        >
          <form className={styles.modal} onSubmit={handleContribution}>
            <div className={styles.modalHeader}>
              <div>
                <h2>Registrar aporte</h2>
                <p>{contributionGoal.goal.name}</p>
              </div>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setContributionGoal(null)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>

            <label>
              Valor do aporte
              <input
                name="amount"
                required
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0,00"
              />
            </label>
            <label>
              Data
              <input
                name="date"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </label>
            <label>
              Descrição
              <input
                name="description"
                maxLength={500}
                placeholder="Observação (opcional)"
              />
            </label>

            {formError && <p className={styles.formError}>{formError}</p>}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setContributionGoal(null)}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.addButton}
                disabled={saving}
              >
                {saving ? "Salvando..." : "Registrar aporte"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
