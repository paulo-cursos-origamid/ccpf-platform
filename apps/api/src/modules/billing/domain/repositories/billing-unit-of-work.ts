import { InvoiceRepository } from './invoice.repository';
import { InvoiceInstallmentRepository } from './invoice-installment.repository';
import { PlanRepository } from './plan.repository';
import { PlanPriceRepository } from './plan-price.repository';
import { PaymentRepository } from './payment.repository';
import { SubscriptionRepository } from './subscription.repository';

/**
 * Repositórios disponíveis dentro de uma transação de Billing.
 *
 * Todas as implementações fornecidas pelo contexto utilizam
 * o mesmo transaction client do Prisma.
 */
export interface BillingUnitOfWorkContext {
  invoiceRepository: InvoiceRepository;
  invoiceInstallmentRepository: InvoiceInstallmentRepository;
  paymentRepository: PaymentRepository;
  subscriptionRepository: SubscriptionRepository;
  planRepository: PlanRepository;
  planPriceRepository: PlanPriceRepository;

  /**
   * Bloqueia a Invoice para serializar confirmações concorrentes.
   *
   * A Invoice é o agregado financeiro que determina se uma
   * obrigação já foi quitada por outra tentativa de pagamento.
   */
  lockInvoice: (invoiceId: string) => Promise<void>;

  /**
   * Bloqueia a Subscription para serializar mutações concorrentes.
   */
  lockSubscription: (subscriptionId: string) => Promise<void>;
}

/**
 * Contrato de Unit of Work do domínio de Billing.
 *
 * O domínio não conhece Prisma nem qualquer implementação
 * específica de transação.
 */
export abstract class BillingUnitOfWork {
  abstract execute<T>(
    work: (context: BillingUnitOfWorkContext) => Promise<T>,
  ): Promise<T>;
}
