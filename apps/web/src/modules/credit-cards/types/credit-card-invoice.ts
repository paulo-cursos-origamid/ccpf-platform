export interface CreditCardInvoiceSettlement {
  principalAmount: string;
  interestAmount: string;
  feeAmount: string;
  discountAmount: string;
  settledAt: string;
}

export type CreditCardInvoiceStatus = "OPEN" | "CLOSED" | "PAID";

export interface CreditCardInvoiceIndicators {
  totalAmount: string;
  installmentCount: number;
  purchaseCount: number;
  principalPaidAmount: string;
  paidAmount: string;
  remainingAmount: string;
  interestAmount: string;
  feeAmount: string;
  discountAmount: string;
  financialObligationStatus: string | null;
}

export interface CreditCardInvoiceInstallment {
  id: string;
  installmentNumber: number;
  amount: string;
  dueDate: string;
}

export interface CreditCardInvoicePurchase {
  id: string;
  title: string;
  totalAmount: string;
  purchaseDate: string;
  installmentCount: number;
  invoiceAmount: string;
  installments: CreditCardInvoiceInstallment[];
}

export interface CreditCardInvoice {
  id: string;
  creditCard: {
    id: string;
    name: string;
    brand: string;
    lastFourDigits: string | null;
  };
  referenceMonth: string;
  closingDate: string;
  dueDate: string;
  status: CreditCardInvoiceStatus;
  indicators: CreditCardInvoiceIndicators;
  settlements: CreditCardInvoiceSettlement[];
  purchases: CreditCardInvoicePurchase[];
  createdAt: string;
  updatedAt: string;
}

export interface CreditCardInvoicesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListCreditCardInvoicesResponse {
  data: CreditCardInvoice[];
  pagination: CreditCardInvoicesPagination;
}

export interface ListCreditCardInvoicesQuery {
  creditCardId?: string;
  status?: CreditCardInvoiceStatus;
  referenceMonthFrom?: string;
  referenceMonthTo?: string;
  page?: number;
  limit?: number;
}

export interface PayCreditCardInvoiceInput {
  accountId: string;
  settledAt: string;
  principalAmount?: string;
  interestAmount?: string;
  feeAmount?: string;
  discountAmount?: string;
  description?: string;
}
