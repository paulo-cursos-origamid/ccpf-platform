import { api } from "@/lib/api/client";
import type {
  CreateInstallmentPlanInput,
  InstallmentPlan,
} from "../types/installment-plan";
import type { FinancialPaymentMethod } from "../types/transaction";

class InstallmentPlansService {
  list() {
    return api.get<InstallmentPlan[]>("/installment-plans");
  }

  create(data: CreateInstallmentPlanInput) {
    return api.post<InstallmentPlan>("/installment-plans", data);
  }

  pay(
    planId: string,
    installmentId: string,
    paidAt: string,
    paymentMethod: FinancialPaymentMethod,
  ) {
    return api.post<unknown>(
      `/installment-plans/${planId}/installments/${installmentId}/pay`,
      { paidAt, paymentMethod },
    );
  }
}

export const installmentPlansService = new InstallmentPlansService();
