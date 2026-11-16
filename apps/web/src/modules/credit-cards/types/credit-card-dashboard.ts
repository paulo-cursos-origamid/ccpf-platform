export interface CreditCardDashboardSummary {
  totalLimit: string;
  committedLimit: string;
  availableLimit: string;
  openInvoiceCount: number;
  openInvoiceAmount: string;
}

export interface CreditCardDashboardMonthlyExpense {
  referenceMonth: string;
  totalAmount: string;
}

export interface CreditCardDashboardCard {
  id: string;
  name: string;
  brand: string;
  lastFourDigits: string | null;
  creditLimit: string;
  committedAmount: string;
  availableLimit: string;
  nextInvoice: {
    id: string;
    referenceMonth: string;
    dueDate: string;
    remainingAmount: string;
  } | null;
}

export interface CreditCardDashboardUpcomingInvoice {
  id: string;
  creditCard: {
    id: string;
    name: string;
    brand: string;
    lastFourDigits: string | null;
  };
  referenceMonth: string;
  dueDate: string;
  remainingAmount: string;
}

export interface CreditCardDashboard {
  summary: CreditCardDashboardSummary;
  monthlyExpenses: CreditCardDashboardMonthlyExpense[];
  cards: CreditCardDashboardCard[];
  upcomingInvoices: CreditCardDashboardUpcomingInvoice[];
}
