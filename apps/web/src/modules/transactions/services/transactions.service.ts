import { api } from "@/lib/api/client";
import type {
  CreateTransactionInput,
  Transaction,
  TransactionType,
} from "../types/transaction";

class TransactionsService {
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
}

export const transactionsService = new TransactionsService();
