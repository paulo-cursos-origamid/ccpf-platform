import { PaymentEntity } from '../entities/payment.entity';

/**
 * Define o contrato de persistência do domínio Payment.
 *
 * A implementação concreta pertence à infraestrutura.
 */
export abstract class PaymentRepository {
  abstract create(payment: PaymentEntity): Promise<PaymentEntity>;

  abstract findById(id: string): Promise<PaymentEntity | null>;

  abstract findByReference(reference: string): Promise<PaymentEntity | null>;

  abstract findByInvoice(invoiceId: string): Promise<PaymentEntity[]>;

  abstract update(payment: PaymentEntity): Promise<PaymentEntity>;
}
