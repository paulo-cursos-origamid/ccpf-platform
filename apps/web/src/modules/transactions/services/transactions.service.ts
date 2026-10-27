import { api } from "@/lib/api/client";
import type { FinancialHistoryItem } from "../types/financial-history";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionType,
  Transfer,
} from "../types/transaction";

class TransactionsService {
  listFinancialHistory() {
    return api.get<FinancialHistoryItem[]>("/transactions/history");
  }

  list(type?: TransactionType) {
    const query = type ? `?type=${type}` : "";
    return api.get<Transaction[]>(`/transactions${query}`);
  }

  get(id: string) {
    return api.get<Transaction>(`/transactions/${id}`);
  }

  create(data: CreateTransactionInput) {
    return api.post<Transaction>("/transactions", data);
  }

  listTransfers() {
    return api.get<Transfer[]>("/transactions/transfers");
  }

  reverseTransaction(id: string) {
    return api.post<unknown>(`/transactions/${id}/reverse`, {});
  }

  reverseTransfer(id: string) {
    return api.post<unknown>(`/transactions/transfers/${id}/reverse`, {});
  }

  createTransfer(data: {
    fromAccountId: string;
    toAccountId: string;
    amount: string;
    description?: string;
  }) {
    return api.post<unknown>("/transactions/transfers", data);
  }
}

export const transactionsService = new TransactionsService();
