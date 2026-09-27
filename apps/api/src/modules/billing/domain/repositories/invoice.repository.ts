import { InvoiceEntity } from '../entities/invoice.entity';

/**
 * Define o contrato de persistência do domínio Invoice.
 *
 * A implementação concreta pertence à infraestrutura.
 */
export abstract class InvoiceRepository {
  abstract create(invoice: InvoiceEntity): Promise<InvoiceEntity>;

  abstract findById(id: string): Promise<InvoiceEntity | null>;

  abstract findByNumber(number: string): Promise<InvoiceEntity | null>;

  abstract findByTenant(tenantId: string): Promise<InvoiceEntity[]>;

  abstract findBySubscription(subscriptionId: string): Promise<InvoiceEntity[]>;

  abstract update(invoice: InvoiceEntity): Promise<InvoiceEntity>;
}
