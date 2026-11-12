export interface CreateCreditCardPurchaseInput {
  title: string;
  totalAmount: string;
  purchaseDate: string;
  installmentCount: number;
  categoryId: string;
  subCategoryId?: string;
  description?: string;
}

export interface CreditCardPurchaseInstallment {
  id: string;
  installmentNumber: number;
  amount: string;
  dueDate: string;
  invoice: {
    id: string;
    referenceMonth: string;
    closingDate: string;
    dueDate: string;
    status: "OPEN" | "CLOSED" | "PAID";
  };
}

export interface CreditCardPurchase {
  id: string;
  tenantId: string;
  userId: string;
  creditCardId: string;
  categoryId: string;
  subCategoryId: string | null;
  title: string;
  totalAmount: string;
  purchaseDate: string;
  installmentCount: number;
  description: string | null;
  installments: CreditCardPurchaseInstallment[];
  createdAt: string;
  updatedAt: string;
}
