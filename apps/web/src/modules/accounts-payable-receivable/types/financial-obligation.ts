/** Contrato HTTP público de um compromisso financeiro. */
export type FinancialObligationType = "PAYABLE" | "RECEIVABLE";
export type FinancialObligationStatus = "PENDING" | "SETTLED" | "CANCELED";

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
  createdAt: string;
  updatedAt: string;
}

/** Campos aceitos pelo cadastro de compromisso. */
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

/** Atualizações pendentes também aceitam null para limpar campos opcionais. */
export type UpdateFinancialObligationInput = Partial<
  Omit<
    CreateFinancialObligationInput,
    "subCategoryId" | "counterparty" | "description"
  >
> & {
  subCategoryId?: string | null;
  counterparty?: string | null;
  description?: string | null;
};

/** Dados da efetivação, incluindo vínculo opcional a uma transação existente. */
export interface SettleFinancialObligationInput {
  settledAt: string;
  transactionId?: string;
}
