import { useMemo } from "react";

import { useDashboardTransactions } from "./useDashboardTransactions";
import { useDashboardAdditionalData } from "./useDashboardAdditionalData";

import {
  calculateCategoryExpenses,
  calculateFinancialSummary,
} from "../utils/dashboard-calculations";

import { ApiError } from "@/lib/http/fetcher";
import { useAccounts } from "@/modules/accounts/hooks/client/useAccounts";
import { AccountStatus } from "@/modules/accounts/types";
import { useTenantStore } from "@/modules/tenant/stores";

/**
 * Centraliza os dados utilizados pelo Dashboard financeiro.
 *
 * Coordena o carregamento de contas, transações, categorias,
 * parcelas e despesas recorrentes do Espaço ativo.
 *
 * Mantém os indicadores financeiros e os estados de carregamento
 * disponíveis para os componentes de apresentação.
 *
 * As requisições assíncronas verificam o Espaço ativo antes
 * de atualizar os estados, evitando respostas de Espaços anteriores.
 *
 * @returns Dados financeiros e estados necessários ao Dashboard.
 */
export function useFinancialDashboard() {
  const { accounts, loading, error, loadAccounts } = useAccounts();
  const tenantId = useTenantStore((state) => state.activeTenantId);

  const {
    transactions,
    transactionsLoading,
    transactionsError,
  } = useDashboardTransactions(tenantId);

  const financial = useMemo(
    () => calculateFinancialSummary(transactions),
    [transactions],
  );

  const financialLoading = loading || transactionsLoading;
  const {
    categoryNames,
    upcomingPayments,
  } = useDashboardAdditionalData(tenantId);

  const categoryExpenses = useMemo(
    () => calculateCategoryExpenses(transactions, categoryNames),
    [transactions, categoryNames],
  );

  const categoryColors = [
    "#047857",
    "#fbb755",
    "#6366f1",
    "#38bdf8",
    "#f97373",
    "#a78bfa",
    "#14b8a6",
  ];

  const isSubscriptionBlocked =
    error instanceof ApiError &&
    error.statusCode === 403 &&
    /assinatura/i.test(error.message);

  const activeAccounts = accounts.filter(
    (account) => account.status === AccountStatus.ACTIVE,
  );

  const archivedAccounts = accounts.filter(
    (account) => account.status === AccountStatus.ARCHIVED,
  );

  const totalBalance = activeAccounts.reduce(
    (total, account) =>
      account.currency === "BRL" ? total + account.balance : total,
    0,
  );

  return {
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
  };
}
