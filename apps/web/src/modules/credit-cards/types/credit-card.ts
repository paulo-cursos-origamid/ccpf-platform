export type CreditCardBrand =
  | "VISA"
  | "MASTERCARD"
  | "ELO"
  | "AMEX"
  | "HIPERCARD"
  | "OTHER";

export type CreditCardStatus = "ACTIVE" | "ARCHIVED";

export interface CreditCard {
  id: string;
  tenantId: string;
  name: string;
  brand: CreditCardBrand;
  lastFourDigits: string | null;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  status: CreditCardStatus;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface CreateCreditCardInput {
  name: string;
  brand: CreditCardBrand;
  lastFourDigits?: string | null;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
}

export type UpdateCreditCardInput = Partial<CreateCreditCardInput>;
