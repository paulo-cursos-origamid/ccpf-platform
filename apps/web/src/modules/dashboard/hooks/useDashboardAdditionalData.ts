import { useEffect, useState } from "react";

import { categoriesService } from "@/modules/categories/services/categories.service";
import { financialObligationsService } from "@/modules/accounts-payable-receivable/services/financial-obligations.service";
import { useTenantStore } from "@/modules/tenant/stores";

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
  const [upcomingPayments, setUpcomingPayments] = useState<
    Array<{ id: string; title: string; amount: number; dueDate: string }>
  >([]);

  useEffect(() => {
    let cancelled = false;

    setCategoryNames({});
    setUpcomingPayments([]);

    if (!tenantId) {
      return () => {
        cancelled = true;
      };
    }

    async function loadAdditionalData() {
      const [categoriesResult, obligationsResult] = await Promise.allSettled([
        categoriesService.list(),
        financialObligationsService.listFiltered("PAYABLE"),
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
  };
}
