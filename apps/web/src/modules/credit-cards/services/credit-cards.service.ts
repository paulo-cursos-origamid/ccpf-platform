import { api } from "@/lib/api/client";

import type {
  CreditCard,
  CreateCreditCardInput,
  UpdateCreditCardInput,
} from "../types/credit-card";
import type {
  CreditCardInvoice,
  ListCreditCardInvoicesQuery,
  ListCreditCardInvoicesResponse,
  PayCreditCardInvoiceInput,
} from "../types/credit-card-invoice";
import type {
  CreditCardPurchase,
  CreateCreditCardPurchaseInput,
} from "../types/credit-card-purchase";
import type { CreditCardInvoicePaymentResult } from "../types/credit-card-payment";

class CreditCardsService {
  list() {
    return api.get<CreditCard[]>("/credit-cards");
  }

  get(id: string) {
    return api.get<CreditCard>(`/credit-cards/${id}`);
  }

  create(data: CreateCreditCardInput) {
    return api.post<CreditCard>("/credit-cards", data);
  }

  update(id: string, data: UpdateCreditCardInput) {
    return api.patch<CreditCard>(`/credit-cards/${id}`, data);
  }

  archive(id: string) {
    return api.post<CreditCard>(`/credit-cards/${id}/archive`, {});
  }

  createPurchase(id: string, data: CreateCreditCardPurchaseInput) {
    return api.post<CreditCardPurchase>(
      `/credit-cards/${id}/purchases`,
      data,
    );
  }

  listInvoices(query: ListCreditCardInvoicesQuery = {}) {
    const params = new URLSearchParams();

    if (query.creditCardId) params.set("creditCardId", query.creditCardId);
    if (query.status) params.set("status", query.status);
    if (query.referenceMonthFrom) {
      params.set("referenceMonthFrom", query.referenceMonthFrom);
    }
    if (query.referenceMonthTo) {
      params.set("referenceMonthTo", query.referenceMonthTo);
    }
    if (query.page !== undefined) {
      params.set("page", String(query.page));
    }
    if (query.limit !== undefined) {
      params.set("limit", String(query.limit));
    }

    const suffix = params.size ? `?${params.toString()}` : "";

    return api.get<ListCreditCardInvoicesResponse>(
      `/credit-cards/invoices${suffix}`,
    );
  }

  getInvoice(invoiceId: string) {
    return api.get<CreditCardInvoice>(
      `/credit-cards/invoices/${invoiceId}`,
    );
  }

  payInvoice(invoiceId: string, data: PayCreditCardInvoiceInput) {
    return api.post<CreditCardInvoicePaymentResult>(
      `/credit-cards/invoices/${invoiceId}/pay`,
      data,
    );
  }
}

export const creditCardsService = new CreditCardsService();
