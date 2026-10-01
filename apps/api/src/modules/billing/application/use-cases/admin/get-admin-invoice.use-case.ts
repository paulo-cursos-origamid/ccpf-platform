import { Injectable, NotFoundException } from '@nestjs/common';

import { InvoiceRepository } from '../../../domain/repositories/invoice.repository';

/**
 * Entrada necessária para consultar uma Invoice
 * no contexto administrativo global.
 */
export interface GetAdminInvoiceInput {
  invoiceId: string;
}

/**
 * Caso de uso responsável pela consulta detalhada de uma Invoice
 * no contexto administrativo da plataforma.
 *
 * Não recebe tenantId porque a consulta é global.
 */
@Injectable()
export class GetAdminInvoiceUseCase {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: GetAdminInvoiceInput) {
    const invoice = await this.invoiceRepository.findAdminById(input.invoiceId);

    if (!invoice) {
      throw new NotFoundException('Invoice não encontrada.');
    }

    return invoice;
  }
}
