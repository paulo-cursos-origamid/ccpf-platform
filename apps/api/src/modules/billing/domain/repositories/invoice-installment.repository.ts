import { InvoiceInstallmentEntity } from '../entities/invoice-installment.entity';

export abstract class InvoiceInstallmentRepository {
  abstract create(
    installment: InvoiceInstallmentEntity,
  ): Promise<InvoiceInstallmentEntity>;

  abstract createMany(
    installments: InvoiceInstallmentEntity[],
  ): Promise<InvoiceInstallmentEntity[]>;

  abstract findById(id: string): Promise<InvoiceInstallmentEntity | null>;

  abstract findByInvoice(
    invoiceId: string,
  ): Promise<InvoiceInstallmentEntity[]>;

  abstract update(
    installment: InvoiceInstallmentEntity,
  ): Promise<InvoiceInstallmentEntity>;
}
