import { api } from "@/lib/api/client";

import type {
  AddFinancialGoalContributionInput,
  CreateFinancialGoalInput,
  FinancialGoalListItem,
} from "../types";
import type { FinancialGoalContribution } from "../types";

class FinancialGoalsService {
  list() {
    return api.get<FinancialGoalListItem[]>("/financial-goals");
  }

  create(data: CreateFinancialGoalInput) {
    return api.post<unknown>("/financial-goals", data);
  }

  archive(id: string) {
    return api.post<unknown>(`/financial-goals/${id}/archive`, {});
  }

  restore(id: string) {
    return api.post<unknown>(`/financial-goals/${id}/restore`, {});
  }

  addContribution(id: string, data: AddFinancialGoalContributionInput) {
    return api.post<unknown>(`/financial-goals/${id}/contributions`, data);
  }

  listContributions(id: string) {
    return api.get<FinancialGoalContribution[]>(
      `/financial-goals/${id}/contributions`,
    );
  }
}

export const financialGoalsService = new FinancialGoalsService();
