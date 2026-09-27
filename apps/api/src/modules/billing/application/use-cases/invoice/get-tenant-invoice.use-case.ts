import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InvoiceEntity } from '../../../domain/entities/invoice.entity';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository';

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
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: GetTenantInvoiceInput): Promise<InvoiceEntity> {
    const invoice = await this.invoiceRepository.findById(input.invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice não encontrada.');
    }

    if (invoice.tenantId !== input.tenantId) {
      throw new ForbiddenException('A Invoice não pertence ao Tenant ativo.');
    }

    return invoice;
  }
}
