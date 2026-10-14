import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InvoiceEntity } from '../../../domain/entities/invoice.entity';
import { InvoiceInstallmentEntity } from '../../../domain/entities/invoice-installment.entity';
import { InvoiceInstallmentRepository } from '../../../domain/repositories/invoice-installment.repository';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository';
import { PaymentRepository } from '../../../domain/repositories/payment.repository';

/**
 * Dados necessários para consultar uma Invoice.
 */
export interface GetTenantInvoiceInput {
  tenantId: string;
  invoiceId: string;
}

/**
 * Caso de uso responsável pela consulta de uma Invoice
 * dentro do Tenant ativo.
 *
 * A validação de tenantId evita que um usuário autenticado
 * consiga consultar uma Invoice pertencente a outro Tenant.
 */
@Injectable()
export class GetTenantInvoiceUseCase {
  constructor(
    private readonly invoiceRepository: InvoiceRepository,
    private readonly invoiceInstallmentRepository: InvoiceInstallmentRepository,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async execute(input: GetTenantInvoiceInput): Promise<
    InvoiceEntity & {
      installments: Array<
        InvoiceInstallmentEntity & {
          payments: Awaited<ReturnType<PaymentRepository['findByInstallment']>>;
        }
      >;
    }
  > {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice não encontrada.');
    }

    if (invoice.tenantId !== input.tenantId) {
      throw new ForbiddenException('A Invoice não pertence ao Tenant ativo.');
    }

    // Carrega as parcelas somente depois de validar o acesso ao Tenant.
    const installments = await this.invoiceInstallmentRepository.findByInvoice(
      invoice.id,
    );

    const installmentsWithPayments = await Promise.all(
      installments.map(async (installment) =>
        Object.assign(installment, {
          payments: await this.paymentRepository.findByInstallment(
            installment.id,
          ),
        }),
      ),
    );

    return Object.assign(invoice, { installments: installmentsWithPayments });
  }
}
