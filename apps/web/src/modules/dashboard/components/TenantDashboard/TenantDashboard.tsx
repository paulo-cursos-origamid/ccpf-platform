"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  ArrowRight,
  CreditCard,
  Plus,
  Tags,
  WalletCards,
} from "@/components/icons";
import { useIdentityStore } from "@/modules/identity/stores/identity.store";

import { useFinancialDashboard } from "../../hooks/useFinancialDashboard";

import { FinancialSummary } from "../FinancialSummary/FinancialSummary";
import { CashFlowChart } from "../CashFlowChart/CashFlowChart";
import { RecentTransactions } from "../RecentTransactions/RecentTransactions";
import { ExpensesByCategory } from "../ExpensesByCategory/ExpensesByCategory";
import { UpcomingPayments } from "../UpcomingPayments/UpcomingPayments";
import { FinancialGoalsOverview } from "../FinancialGoalsOverview/FinancialGoalsOverview";

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
  const user = useIdentityStore((state) => state.user);
  const firstName = user?.name?.trim().split(/\s+/)[0];
  const {
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
          <span className={styles.eyebrow}>Visão geral</span>
          <h1 className={styles.title}>Dashboard financeiro</h1>
          <p className={styles.description}>
            Olá{firstName ? `, ${firstName}` : ""}. Acompanhe suas contas e
            movimentações.
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

      <section
        className={styles.dashboardFinancialGrid}
        aria-label="Análises financeiras"
      >
        <section className={styles.dashboardPanel} aria-label="Ações rápidas">
          <div className={styles.dashboardPanelHeading}>
            <div>
              <h2>Ações rápidas</h2>
              <p>Acesse suas principais áreas financeiras</p>
            </div>
          </div>
          <div className={styles.quickActionsGrid}>
            <Link href="/dashboard/accounts" className={styles.quickAction}>
              <WalletCards size={17} aria-hidden="true" />
              <span>Contas</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link href="/dashboard/transactions" className={styles.quickAction}>
              <ArrowLeftRight size={17} aria-hidden="true" />
              <span>Transações</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link href="/dashboard/categories" className={styles.quickAction}>
              <Tags size={17} aria-hidden="true" />
              <span>Categorias</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link
              href="/dashboard/financial-goals"
              className={styles.quickAction}
            >
              <Plus size={17} aria-hidden="true" />
              <span>Metas financeiras</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>

        <CashFlowChart
          financialLoading={financialLoading}
          transactionsError={transactionsError}
          financial={financial}
        />
      </section>

      <section
        className={styles.dashboardInsightsGrid}
        aria-label="Análises e planejamento"
      >
        <ExpensesByCategory
          financialLoading={financialLoading}
          transactionsError={transactionsError}
          categoryExpenses={categoryExpenses}
          categoryColors={categoryColors}
        />
        <FinancialGoalsOverview />
      </section>

      <section
        className={styles.dashboardOverviewGrid}
        aria-label="Movimentações e pagamentos"
      >
        <RecentTransactions
          financialLoading={financialLoading}
          transactionsError={transactionsError}
          financial={financial}
        />
        <UpcomingPayments upcomingPayments={upcomingPayments} />
      </section>
    </main>
  );
}
