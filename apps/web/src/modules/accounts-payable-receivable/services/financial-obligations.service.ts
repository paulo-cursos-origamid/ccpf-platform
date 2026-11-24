import { api } from "@/lib/api/client";
import type {
  CreateFinancialObligationInput,
  FinancialObligation,
  ListFinancialObligationsParams,
  PaginatedFinancialObligationsResponse,
  FinancialObligationStatus,
  FinancialObligationType,
  SettleFinancialObligationInput,
  UpdateFinancialObligationInput,
} from "../types";

/** Encapsula as chamadas do módulo usando o tenant ativo do ApiClient. */
class FinancialObligationsService {
  list() {
    return api.get<FinancialObligation[]>("/financial-obligations");
  }

  create(data: CreateFinancialObligationInput) {
    return api.post<FinancialObligation>("/financial-obligations", data);
  }

  update(id: string, data: UpdateFinancialObligationInput) {
    return api.patch<FinancialObligation>(`/financial-obligations/${id}`, data);
  }

  settle(id: string, data: SettleFinancialObligationInput) {
    return api.post<FinancialObligation>(
      `/financial-obligations/${id}/settle`,
      data,
    );
  }

  cancel(id: string) {
    return api.post<FinancialObligation>(
      `/financial-obligations/${id}/cancel`,
      {},
    );
  }

  listPaginated(params: ListFinancialObligationsParams = {}) {
    const query = new URLSearchParams();

    if (params.type) query.set("type", params.type);
    if (params.status) query.set("status", params.status);
    if (params.sourceType) query.set("sourceType", params.sourceType);
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.limit !== undefined) query.set("limit", String(params.limit));
    if (params.startDate) query.set("startDate", params.startDate);
    if (params.endDate) query.set("endDate", params.endDate);

    const suffix = query.size ? `?${query.toString()}` : "";

    return api.get<PaginatedFinancialObligationsResponse>(
      `/financial-obligations/paginated${suffix}`,
    );
  }

  listFiltered(
    type?: FinancialObligationType,
    status?: FinancialObligationStatus,
  ) {
    const query = new URLSearchParams();
    if (type) query.set("type", type);
    if (status) query.set("status", status);
    const suffix = query.size ? `?${query.toString()}` : "";
    return api.get<FinancialObligation[]>(`/financial-obligations${suffix}`);
  }
}

export const financialObligationsService = new FinancialObligationsService();
