import type { Transaction } from "@/modules/transactions/types/transaction";
import type { DashboardFinancial } from "../components/TenantDashboard/dashboard.types";

/**
 * Calcula os indicadores financeiros do Dashboard.
 *
 * Consolida receitas e despesas do mês atual, a evolução
 * financeira dos últimos seis meses e as transações recentes.
 *
 * @param transactions - Transações do Espaço ativo.
 * @returns Indicadores financeiros consolidados.
 */
export function calculateFinancialSummary(
  transactions: Transaction[],
): DashboardFinancial {
    const now = new Date();
    const currentMonth = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, "0"),
    ].join("-");

    const monthly = transactions.filter(
      (item) => item.date.slice(0, 7) === currentMonth,
    );

    const income = monthly
      .filter((item) => item.type === "INCOME")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const expense = monthly
      .filter((item) => item.type === "EXPENSE")
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const chart = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
      const key = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
      ].join("-");

      const items = transactions.filter(
        (item) => item.date.slice(0, 7) === key,
      );

      return {
        month: new Intl.DateTimeFormat("pt-BR", {
          month: "short",
        }).format(date),
        receitas: items
          .filter((item) => item.type === "INCOME")
          .reduce((sum, item) => sum + Number(item.amount), 0),
        despesas: items
          .filter((item) => item.type === "EXPENSE")
          .reduce((sum, item) => sum + Number(item.amount), 0),
      };
    });

    const recent = [...transactions]
      .sort(
        (a, b) =>
          b.date.localeCompare(a.date) ||
          (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
      )
      .slice(0, 6);

    return { income, expense, chart, recent };
  }

/**
 * Agrupa as despesas do mês atual por categoria.
 *
 * Utiliza os nomes das categorias carregadas para apresentar
 * os valores consolidados no gráfico de despesas.
 *
 * @param transactions - Transações do Espaço ativo.
 * @param categoryNames - Mapeamento entre IDs e nomes das categorias.
 * @returns Categorias e seus respectivos valores de despesas.
 */
export function calculateCategoryExpenses(
  transactions: Transaction[],
  categoryNames: Record<string, string>,
): Array<{ name: string; value: number }> {
    const month = new Date().toISOString().slice(0, 7);
    const totals = new Map<string, number>();

    for (const transaction of transactions) {
      if (
        transaction.type !== "EXPENSE" ||
        transaction.date.slice(0, 7) !== month
      )
        continue;

      const name = categoryNames[transaction.categoryId] ?? "Sem categoria";

      totals.set(name, (totals.get(name) ?? 0) + Number(transaction.amount));
    }

    return [...totals.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }
