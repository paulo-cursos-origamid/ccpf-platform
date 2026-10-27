import { api } from "@/lib/api/client";
import type {
  CreateInstallmentPlanInput,
  InstallmentPlan,
} from "../types/installment-plan";

class InstallmentPlansService {
  list() {
    return api.get<InstallmentPlan[]>("/installment-plans");
  }

  create(data: CreateInstallmentPlanInput) {
    return api.post<InstallmentPlan>("/installment-plans", data);
  }

  pay(planId: string, installmentId: string, paidAt: string) {
    return api.post<unknown>(
      `/installment-plans/${planId}/installments/${installmentId}/pay`,
      { paidAt },
    );
  }
}

export const installmentPlansService = new InstallmentPlansService();
