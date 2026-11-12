import { ListCreditCards } from "@/modules/credit-cards/components/client/ListCreditCards";
import { ListCreditCardInvoices } from "@/modules/credit-cards/components/client/ListCreditCardInvoices";

export default function CreditCardsPage() {
  return (
    <main>
      <ListCreditCards />
      <ListCreditCardInvoices />
    </main>
  );
}
