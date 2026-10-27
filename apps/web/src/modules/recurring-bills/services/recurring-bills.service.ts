import { api } from "@/lib/api/client";
import type {
  CreateRecurringBillInput,
  RecurringBill,
} from "../types/recurring-bill";

class RecurringBillsService {
  list() {
    return api.get<RecurringBill[]>("/recurring-bills");
  }

  create(data: CreateRecurringBillInput) {
    return api.post<unknown>("/recurring-bills", data);
  }

  generate(id: string) {
    return api.post<unknown>(`/recurring-bills/${id}/generate`, {});
  }

  pay(
    billId: string,
    occurrenceId: string,
    amount: string,
    paidAt: string = new Date().toISOString(),
  ) {
    return api.post<unknown>(
      `/recurring-bills/${billId}/occurrences/${occurrenceId}/pay`,
      {
        amount,
        paidAt,
      },
    );
  }
}

export const recurringBillsService = new RecurringBillsService();
