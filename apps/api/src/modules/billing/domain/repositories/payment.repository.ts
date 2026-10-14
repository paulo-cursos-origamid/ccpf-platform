import { PaymentEntity } from '../entities/payment.entity';

export abstract class PaymentRepository {
  abstract create(payment: PaymentEntity): Promise<PaymentEntity>;

  abstract findById(id: string): Promise<PaymentEntity | null>;

  abstract findByReference(reference: string): Promise<PaymentEntity | null>;

  abstract findByInstallment(installmentId: string): Promise<PaymentEntity[]>;

  abstract update(payment: PaymentEntity): Promise<PaymentEntity>;
}
