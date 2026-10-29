"use client";

import Link from "next/link";
import { ArrowRight, CreditCard } from "@/components/icons";

import { useFinancialDashboard } from "../../hooks/useFinancialDashboard";

import { FinancialSummary } from "../FinancialSummary/FinancialSummary";
import { CashFlowChart } from "../CashFlowChart/CashFlowChart";
import { RecentTransactions } from "../RecentTransactions/RecentTransactions";
import { ExpensesByCategory } from "../ExpensesByCategory/ExpensesByCategory";
import { UpcomingPayments } from "../UpcomingPayments/UpcomingPayments";
import { AccountsOverview } from "../AccountsOverview/AccountsOverview";

import styles from "./TenantDashboard.module.scss";

/**
 * Componente principal do Dashboard financeiro.
 *
 * Organiza os indicadores financeiros, gráficos, movimentações,
 * pagamentos futuros e contas do Espaço ativo.
 *
 * Os dados são fornecidos pelo hook useFinancialDashboard,
 * mantendo a apresentação separada das regras de negócio.
 */
export function TenantDashboard() {
  const {
    accounts,
    loading,
    error,
    loadAccounts,
    isSubscriptionBlocked,
    totalBalance,
    financial,
    financialLoading,
    transactionsError,
    categoryExpenses,
    categoryColors,
    upcomingPayments,
  } = useFinancialDashboard();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerIntro}>
          <span className={styles.eyebrow}>VISÃO GERAL FINANCEIRA</span>
          <h1 className={styles.title}>Seu dinheiro, em perspectiva.</h1>
          <p className={styles.description}>
            Acompanhe seu saldo, entenda suas movimentações e mantenha suas
            finanças sob controle.
          </p>
        </div>

        <Link href="/dashboard/transactions" className={styles.primaryAction}>
          <CreditCard size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>Ver movimentações</span>
          <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </header>

      {error ? (
        <section
          className={`${styles.error} ${
            isSubscriptionBlocked ? styles.subscriptionError : ""
          }`}
          role="alert"
        >
          <div
            className={
              isSubscriptionBlocked
                ? styles.subscriptionErrorContent
                : undefined
            }
          >
            {isSubscriptionBlocked ? (
              <div className={styles.subscriptionIcon}>
                <CreditCard size={27} strokeWidth={1.8} aria-hidden="true" />
              </div>
            ) : null}

            <strong
              className={
                isSubscriptionBlocked ? styles.subscriptionTitle : undefined
              }
            >
              {isSubscriptionBlocked
                ? "Acesso às contas temporariamente bloqueado"
                : "Não foi possível carregar suas contas."}
            </strong>

            <p>
              {isSubscriptionBlocked
                ? "Acompanhe suas contas e o saldo financeiro do seu ambiente. Para liberar o acesso, consulte a cobrança e regularize eventuais pendências. Os recursos serão disponibilizados quando a assinatura estiver regularizada."
                : "Verifique sua conexão ou tente novamente. Se o problema persistir, entre em contato com o suporte."}
            </p>
          </div>

          {isSubscriptionBlocked ? (
            <Link
              href="/settings/billing"
              className={`${styles.retryButton} ${styles.billingButton}`}
            >
              <span>Consultar cobrança</span>
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
          ) : (
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => void loadAccounts().catch(() => undefined)}
            >
              Tentar novamente
            </button>
          )}
        </section>
      ) : null}

      <FinancialSummary
        loading={loading}
        totalBalance={totalBalance}
        financialLoading={financialLoading}
        transactionsError={transactionsError}
        financial={financial}
      />

      {transactionsError && (
        <div className={styles.dashboardNotice} role="alert">
          Não foi possível carregar as movimentações financeiras. Os indicadores
          e gráficos dependentes delas estão indisponíveis.
        </div>
      )}

      <section className={styles.analyticsSection} aria-label="Análises financeiras">
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>ANÁLISE FINANCEIRA</span>
          <h2>Visão das suas finanças</h2>
        </div>

        <div className={styles.dashboardFinancialGrid}>
          <CashFlowChart
            financialLoading={financialLoading}
            transactionsError={transactionsError}
            financial={financial}
          />

          <ExpensesByCategory
            financialLoading={financialLoading}
            transactionsError={transactionsError}
            categoryExpenses={categoryExpenses}
            categoryColors={categoryColors}
          />
        </div>
      </section>

      <section className={styles.lowerSection} aria-label="Atividade financeira">
        <div className={styles.sectionHeading}>
          <span className={styles.eyebrow}>ACOMPANHAMENTO</span>
          <h2>Movimentações e compromissos</h2>
        </div>

        <div className={styles.dashboardCategoryGrid}>
          <RecentTransactions
            financialLoading={financialLoading}
            transactionsError={transactionsError}
            financial={financial}
          />

          <UpcomingPayments upcomingPayments={upcomingPayments} />
        </div>
      </section>

      <AccountsOverview accounts={accounts} loading={loading} />
    </main>
  );
}
