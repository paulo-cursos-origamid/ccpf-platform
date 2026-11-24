import { useEffect, useState } from "react";

import { categoriesService } from "@/modules/categories/services/categories.service";
import { financialObligationsService } from "@/modules/accounts-payable-receivable/services/financial-obligations.service";
import { useTenantStore } from "@/modules/tenant/stores";
import type { FinancialObligationInstallmentPaymentStatus } from "@/modules/accounts-payable-receivable/types";

/**
 * Carrega categorias e próximas obrigações financeiras do Espaço ativo.
 *
 * Utiliza o domínio centralizado de obrigações como fonte dos pagamentos,
 * evitando consultas paralelas a parcelas e despesas recorrentes.
 */
export function useDashboardAdditionalData(tenantId: string | null) {
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>(
    {},
  );
  const [installmentPaymentStatus, setInstallmentPaymentStatus] =
    useState<FinancialObligationInstallmentPaymentStatus | null>(null);
  const [upcomingPayments, setUpcomingPayments] = useState<
    Array<{ id: string; title: string; amount: number; dueDate: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    setCategoryNames({});
    setUpcomingPayments([]);
    setInstallmentPaymentStatus(null);

    if (!tenantId) {
      return () => {
        cancelled = true;
      };
    }

    async function loadAdditionalData() {
      const [
        categoriesResult,
        obligationsResult,
        installmentStatusResult,
      ] = await Promise.allSettled([
        categoriesService.list(),
        financialObligationsService.listFiltered("PAYABLE"),
        financialObligationsService.listPaginated({
          type: "PAYABLE",
          sourceType: "INSTALLMENT",
          page: 1,
          limit: 1,
        }),
      ]);

      if (cancelled || useTenantStore.getState().activeTenantId !== tenantId) {
        return;
      }

      if (categoriesResult.status === "fulfilled") {
        const names: Record<string, string> = {};

        for (const category of categoriesResult.value) {
          names[category.id] = category.name;
        }

        setCategoryNames(names);
      }

      setInstallmentPaymentStatus(
        installmentStatusResult.status === "fulfilled"
          ? installmentStatusResult.value.summary.installmentPaymentStatus ?? null
          : null,
      );

      if (obligationsResult.status !== "fulfilled") {
        setUpcomingPayments([]);
        return;
      }

      const toCents = (value: string) => {
        const amount = Number(value);
        return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
      };

      const today = new Date().toISOString().slice(0, 10);

      const payments = obligationsResult.value
        .filter(
          (obligation) =>
            obligation.status === "PENDING" ||
            obligation.status === "PARTIALLY_SETTLED",
        )
        .map((obligation) => {
          const settledPrincipalCents = (obligation.settlements ?? []).reduce(
            (total, settlement) =>
              total + toCents(settlement.principalAmount),
            0,
          );

          const remainingCents = Math.max(
            0,
            toCents(obligation.amount) - settledPrincipalCents,
          );

          return {
            id: obligation.id,
            title: obligation.title,
            amount: remainingCents / 100,
            dueDate: obligation.dueDate,
          };
        })
        .filter(
          (payment) =>
            payment.amount > 0 && payment.dueDate.slice(0, 10) >= today,
        )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 5);

      if (cancelled || useTenantStore.getState().activeTenantId !== tenantId) {
        return;
      }

      setUpcomingPayments(payments);
    }

    void loadAdditionalData();

    return () => {
      cancelled = true;
    };
  }, [tenantId]);

  return {
    categoryNames,
    upcomingPayments,
    installmentPaymentStatus,
  };
}
