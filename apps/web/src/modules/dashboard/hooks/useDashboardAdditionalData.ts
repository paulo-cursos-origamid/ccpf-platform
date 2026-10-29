import { useEffect, useState } from "react";

import { categoriesService } from "@/modules/categories/services/categories.service";
import { recurringBillsService } from "@/modules/recurring-bills/services/recurring-bills.service";
import { useTenantStore } from "@/modules/tenant/stores";
import { installmentPlansService } from "@/modules/transactions/services/installment-plans.service";

/**
 * Carrega informações complementares do Dashboard financeiro.
 *
 * Consulta categorias, parcelas e despesas recorrentes.
 * Consolida os próximos pagamentos e os nomes das categorias.
 *
 * Verifica o Espaço ativo antes de atualizar os estados,
 * descartando respostas de requisições anteriores.
 *
 * @param tenantId - Identificador do Espaço ativo.
 * @returns Mapeamento de categorias e próximos pagamentos.
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

    /**
     * Carrega informações complementares do Dashboard.
     *
     * Consulta categorias, planos de parcelas e despesas recorrentes.
     * Organiza os próximos pagamentos e os nomes das categorias.
     *
     * Os resultados são utilizados somente quando pertencem
     * ao Espaço que iniciou o carregamento.
     */
    async function loadAdditionalData() {
      const [categoriesResult, installmentsResult, recurringResult] =
        await Promise.allSettled([
          categoriesService.list(),
          installmentPlansService.list(),
          recurringBillsService.list(),
        ]);

      if (cancelled || useTenantStore.getState().activeTenantId !== tenantId)
        return;

      if (categoriesResult.status === "fulfilled") {
        const names: Record<string, string> = {};

        for (const category of categoriesResult.value) {
          names[category.id] = category.name;
        }

        setCategoryNames(names);
      }

      const payments: Array<{
        id: string;
        title: string;
        amount: number;
        dueDate: string;
      }> = [];

      if (installmentsResult.status === "fulfilled") {
        for (const plan of installmentsResult.value) {
          for (const installment of plan.installments ?? []) {
            if (installment.status === "PAID") continue;

            payments.push({
              id: `installment-${installment.id}`,
              title: `${plan.title} (${installment.installmentNumber}/${plan.installmentCount})`,
              amount: Number(installment.amount),
              dueDate: installment.dueDate,
            });
          }
        }
      }

      if (recurringResult.status === "fulfilled") {
        for (const bill of recurringResult.value) {
          if (!bill.isActive) continue;

          for (const occurrence of bill.occurrences ?? []) {
            if (occurrence.status === "PAID") continue;

            payments.push({
              id: `recurring-${occurrence.id}`,
              title: bill.title,
              amount: Number(occurrence.expectedAmount),
              dueDate: occurrence.dueDate,
            });
          }
        }
      }

      const today = new Date().toISOString().slice(0, 10);

      setUpcomingPayments(
        payments
          .filter((payment) => payment.dueDate.slice(0, 10) >= today)
          .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
          .slice(0, 5),
      );
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
