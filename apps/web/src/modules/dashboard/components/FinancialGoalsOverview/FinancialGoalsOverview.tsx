"use client";

import Link from "next/link";
import { ArrowRight, CircleDollarSign } from "@/components/icons";
import { useFinancialGoals } from "@/modules/financial-goals/hooks";

import styles from "./FinancialGoalsOverview.module.scss";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

export function FinancialGoalsOverview() {
  const { goals, loading, error, loadGoals } = useFinancialGoals();

  const activeGoals = goals.filter(
    (item) => item.effectiveStatus === "ACTIVE",
  );

  return (
    <section className={styles.section} aria-label="Metas financeiras">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>PLANEJAMENTO</span>
          <h2 className={styles.title}>Metas financeiras</h2>
          <p className={styles.description}>
            Acompanhe a evolução dos seus objetivos financeiros.
          </p>
        </div>

        <Link href="/dashboard/financial-goals" className={styles.link}>
          Ver todas <ArrowRight size={16} />
        </Link>
      </header>

      {loading ? (
        <div className={styles.feedback}>Carregando metas financeiras...</div>
      ) : error ? (
        <div className={styles.feedback}>
          <span>Não foi possível carregar suas metas.</span>
          <button type="button" onClick={() => void loadGoals()}>
            Tentar novamente
          </button>
        </div>
      ) : activeGoals.length === 0 ? (
        <div className={styles.emptyState}>
          <CircleDollarSign size={28} />
          <strong>Nenhuma meta em andamento</strong>
          <p>Crie uma meta e acompanhe seu progresso por aqui.</p>
          <Link href="/dashboard/financial-goals" className={styles.emptyLink}>
            Criar ou consultar metas <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {activeGoals.map((item) => {
            const percentage = Math.min(
              Math.max(Number(item.progress.percentage) || 0, 0),
              100,
            );
            const total = Number(item.progress.totalAmount) || 0;
            const target = Number(item.goal.targetAmount) || 0;
            const remaining = Number(item.progress.remainingAmount) || 0;

            return (
              <Link
                key={item.goal.id}
                href="/dashboard/financial-goals"
                className={styles.goalCard}
                aria-label={`Ver meta ${item.goal.name}`}
              >
                <div className={styles.goalHeader}>
                  <span className={styles.goalIcon}>
                    <CircleDollarSign size={19} />
                  </span>
                  <strong className={styles.goalName}>{item.goal.name}</strong>
                  <ArrowRight size={16} className={styles.cardArrow} />
                </div>

                <div className={styles.progress}>
                  <div
                    className={styles.donut}
                    style={{
                      background: `conic-gradient(var(--accent-primary) ${percentage * 3.6}deg, var(--border-primary) 0deg)`,
                    }}
                    role="img"
                    aria-label={`${percentage.toFixed(0)}% alcançado`}
                  >
                    <div className={styles.donutCenter}>
                      <strong>{percentage.toFixed(0)}%</strong>
                      <span>alcançado</span>
                    </div>
                  </div>

                  <div className={styles.values}>
                    <span>Valor acumulado</span>
                    <strong className={styles.total}>{formatCurrency(total)}</strong>
                    <span>Objetivo: {formatCurrency(target)}</span>
                    <div className={styles.track}>
                      <span style={{ width: `${percentage}%` }} />
                    </div>
                    <div className={styles.remaining}>
                      <span>Restante</span>
                      <strong>{formatCurrency(remaining)}</strong>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
