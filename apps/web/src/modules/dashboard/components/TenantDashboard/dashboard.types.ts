import type { Transaction } from "@/modules/transactions/types/transaction";

/**
 * Representa os indicadores financeiros consolidados.
 *
 * Contém receitas, despesas, evolução mensal e movimentações
 * recentes utilizadas nos componentes do Dashboard.
 */
export interface DashboardFinancial {
  income: number;
  expense: number;
  chart: Array<{
    month: string;
    receitas: number;
    despesas: number;
  }>;
  recent: Transaction[];
}

/**
 * Representa um pagamento futuro apresentado no Dashboard.
 *
 * Identifica a obrigação financeira, seu valor e vencimento.
 */
export interface UpcomingPayment {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
}
