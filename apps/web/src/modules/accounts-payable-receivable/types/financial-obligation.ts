export type FinancialObligationType = "PAYABLE" | "RECEIVABLE";

export type FinancialObligationStatus =
  | "PENDING"
  | "PARTIALLY_SETTLED"
  | "SETTLED"
  | "CANCELED";

export interface FinancialObligationSettlement {
  id: string;
  obligationId: string;
  tenantId: string;
  userId: string;
  transactionId: string | null;
  principalAmount: string;
  interestAmount: string;
  feeAmount: string;
  discountAmount: string;
  settledAmount: string;
  settledAt: string;
  createdAt: string;
}

export interface FinancialObligation {
  id: string;
  tenantId: string;
  userId: string;
  accountId: string;
  categoryId: string;
  subCategoryId: string | null;
  transactionId: string | null;
  type: FinancialObligationType;
  status: FinancialObligationStatus;
  title: string;
  counterparty: string | null;
  amount: string;
  dueDate: string;
  settledAt: string | null;
  description: string | null;
  settlements?: FinancialObligationSettlement[];
  createdAt: string;
  updatedAt: string;
}

export interface FinancialObligationPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface FinancialObligationSummary {
  totalCount: number;
  pendingCount: number;
  partiallySettledCount: number;
  settledCount: number;
  canceledCount: number;
  totalRemainingAmount: string;
  overdueCount: number;
  overdueRemainingAmount: string;
}

export interface PaginatedFinancialObligationsResponse {
  data: FinancialObligation[];
  pagination: FinancialObligationPagination;
  summary: FinancialObligationSummary;
}

export interface ListFinancialObligationsParams {
  type?: FinancialObligationType;
  status?: FinancialObligationStatus;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}

export interface CreateFinancialObligationInput {
  type: FinancialObligationType;
  title: string;
  amount: string;
  dueDate: string;
  accountId: string;
  categoryId: string;
  subCategoryId?: string;
  counterparty?: string;
  description?: string;
}

export type UpdateFinancialObligationInput = Partial<
  Omit<CreateFinancialObligationInput, "subCategoryId" | "counterparty" | "description">
> & {
  subCategoryId?: string | null;
  counterparty?: string | null;
  description?: string | null;
};

export interface SettleFinancialObligationInput {
  settledAt: string;
  principalAmount?: string;
  interestAmount?: string;
  feeAmount?: string;
  discountAmount?: string;
  transactionId?: string;
  description?: string;
}
