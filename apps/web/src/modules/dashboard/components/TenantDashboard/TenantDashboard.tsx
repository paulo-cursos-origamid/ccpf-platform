"use client";

import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeftRight,
  ArrowRight,
  CreditCard,
  FileText,
  Plus,
  Tags,
  WalletCards,
} from "@/components/icons";
import { useIdentityStore } from "@/modules/identity/stores/identity.store";

import { useFinancialDashboard } from "../../hooks/useFinancialDashboard";
import { useCreditCardDashboard } from "@/modules/credit-cards/hooks/client/useCreditCardDashboard";

import { FinancialSummary } from "../FinancialSummary/FinancialSummary";
import { CashFlowChart } from "../CashFlowChart/CashFlowChart";
import { RecentTransactions } from "../RecentTransactions/RecentTransactions";
import { ExpensesByCategory } from "../ExpensesByCategory/ExpensesByCategory";
import { UpcomingPayments } from "../UpcomingPayments/UpcomingPayments";
import { FinancialGoalsOverview } from "../FinancialGoalsOverview/FinancialGoalsOverview";
import { PaymentMethodsSummary } from "../PaymentMethodsSummary/PaymentMethodsSummary";
import { InstallmentPaymentStatus } from "../InstallmentPaymentStatus/InstallmentPaymentStatus";

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
function creditCardMonthLabel(value: string): string {
  const referenceMonth = value.slice(0, 7);
  const date = new Date(`${referenceMonth}-01T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("pt-BR", {
    month: "short",
    year: "2-digit",
  });
}

function formatDashboardCurrency(value: string | number | undefined): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(value ?? 0));
}

export function TenantDashboard() {
  const {
    dashboard: creditCardDashboard,
    loading: creditCardsLoading,
    error: creditCardsError,
    load: loadCreditCardDashboard,
  } = useCreditCardDashboard();

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
    installmentPaymentStatus,
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

      <section
        className={`${styles.dashboardPanel} ${styles.creditCardOverview}`}
        aria-label="Resumo dos cartões de crédito"
      >
        <div className={styles.dashboardPanelHeading}>
          <div>
            <h2>Cartões de crédito</h2>
            <p>Limites disponíveis e faturas em aberto</p>
          </div>
          <Link href="/dashboard/credit-cards">Ver cartões</Link>
        </div>

        {creditCardsLoading ? (
          <p className={styles.dashboardEmpty}>Carregando indicadores dos cartões...</p>
        ) : creditCardsError ? (
          <div className={styles.creditCardFeedback} role="alert">
            <p>Não foi possível carregar os indicadores dos cartões.</p>
            <button
              type="button"
              className={styles.retryButton}
              onClick={() => void loadCreditCardDashboard()}
            >
              Tentar novamente
            </button>
          </div>
        ) : !creditCardDashboard || creditCardDashboard.cards.length === 0 ? (
          <p className={styles.dashboardEmpty}>
            Nenhum cartão cadastrado.{" "}
            <Link href="/dashboard/credit-cards">Cadastrar cartão</Link>
          </p>
        ) : (
          <>
          <div className={styles.creditCardChartSection}>
            <div className={styles.creditCardChartHeading}>
              <h3>Gastos dos últimos 6 meses</h3>
              <span>Despesas lançadas nas faturas</span>
            </div>

            {creditCardDashboard.monthlyExpenses.length > 0 ? (
              <div className={styles.creditCardChart}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={creditCardDashboard.monthlyExpenses.slice(-6).map((item) => ({
                      month: creditCardMonthLabel(item.referenceMonth),
                      total: Number(item.totalAmount),
                    }))}
                    margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis
                      tickFormatter={(value: number) =>
                        value.toLocaleString("pt-BR", {
                          notation: "compact",
                          maximumFractionDigits: 1,
                        })
                      }
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatDashboardCurrency(Number(value)),
                        "Despesas",
                      ]}
                    />
                    <Bar
                      dataKey="total"
                      name="Despesas"
                      fill="var(--accent-primary)"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className={styles.dashboardEmpty}>
                Ainda não existem despesas registradas nas faturas.
              </p>
            )}
          </div>

          <div className={styles.creditCardMetrics}>
            <article className={styles.creditCardMetric}>
              <span>Limite total</span>
              <strong>{formatDashboardCurrency(creditCardDashboard.summary.totalLimit)}</strong>
            </article>
            <article className={styles.creditCardMetric}>
              <span>Limite comprometido</span>
              <strong>{formatDashboardCurrency(creditCardDashboard.summary.committedLimit)}</strong>
            </article>
            <article className={styles.creditCardMetric}>
              <span>Limite disponível</span>
              <strong>{formatDashboardCurrency(creditCardDashboard.summary.availableLimit)}</strong>
            </article>
            <article className={styles.creditCardMetric}>
              <span>Faturas em aberto</span>
              <strong>{formatDashboardCurrency(creditCardDashboard.summary.openInvoiceAmount)}</strong>
              <small>{creditCardDashboard.summary.openInvoiceCount} fatura(s)</small>
            </article>
          </div>
          </>
        )}
      </section>

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
            <Link
              href="/dashboard/accounts-payable-receivable"
              className={styles.quickAction}
            >
              <FileText size={17} aria-hidden="true" />
              <span>Contas a pagar e receber</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link href="/dashboard/credit-cards" className={styles.quickAction}>
              <CreditCard size={17} aria-hidden="true" />
              <span>Cartões de crédito</span>
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
        <PaymentMethodsSummary />
          <InstallmentPaymentStatus status={installmentPaymentStatus} />
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
