export type PaymentMethod =
  | "CASH"
  | "PIX"
  | "BANK_SLIP"
  | "DEBIT_CARD"
  | "CREDIT_CARD";

export interface PaymentMethodSummaryItem {
  paymentMethod: PaymentMethod | null;
  totalAmount: number | string;
  percentage: number;
}

export interface PaymentMethodsSummary {
  month: string;
  totalAmount: number | string;
  methods: PaymentMethodSummaryItem[];
}
