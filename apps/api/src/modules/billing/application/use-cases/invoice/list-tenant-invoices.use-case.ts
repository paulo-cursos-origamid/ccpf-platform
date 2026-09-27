import { Injectable } from '@nestjs/common';

import { InvoiceEntity } from '../../../domain/entities/invoice.entity';
import { InvoiceRepository } from '../../../domain/repositories/invoice.repository';

/**
 * Caso de uso responsável pela listagem das Invoices
 * pertencentes ao Tenant ativo.
 *
 * A autorização de pertencimento ao Tenant ocorre na camada
 * de apresentação através do TenantContextGuard.
 */
@Injectable()
export class ListTenantInvoicesUseCase {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(tenantId: string): Promise<InvoiceEntity[]> {
    return this.invoiceRepository.findByTenant(tenantId);
  }
}
