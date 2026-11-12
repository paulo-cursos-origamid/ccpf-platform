import type { FinancialObligation } from "@/modules/accounts-payable-receivable/types";

export type CreditCardInvoicePaymentResult = Omit<
  FinancialObligation,
  "accountId" | "categoryId"
> & {
  accountId: string | null;
  categoryId: string | null;
};
