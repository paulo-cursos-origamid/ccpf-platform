import { api } from "@/lib/api/client";
import type {
  CreateRecurringBillInput,
  RecurringBill,
  PayRecurringBillInput,
  UpdateRecurringBillInput,
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

  update(id: string, data: UpdateRecurringBillInput) {
    return api.patch<unknown>(`/recurring-bills/${id}`, data);
  }

  pay(
    billId: string,
    occurrenceId: string,
    data: PayRecurringBillInput,
  ) {
    return api.post<unknown>(
      `/recurring-bills/${billId}/occurrences/${occurrenceId}/pay`,
      data,
    );
  }
}

export const recurringBillsService = new RecurringBillsService();
