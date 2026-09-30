import { Injectable } from '@nestjs/common';

import {
  FindAdminInvoicesOptions,
  InvoiceRepository,
} from '../../../domain/repositories/invoice.repository';
import { InvoiceStatus } from '../../../domain/enums/invoice-status.enum';

/**
 * Parâmetros recebidos pelo caso de uso de listagem administrativa.
 */
export interface ListAdminInvoicesInput {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
}

/**
 * Caso de uso responsável pela consulta global das Invoices
 * no contexto administrativo da plataforma.
 *
 * A autorização é responsabilidade da camada de apresentação,
 * através do PlatformPermissionGuard + BILLING_MANAGE.
 */
@Injectable()
export class ListAdminInvoicesUseCase {
  constructor(private readonly invoiceRepository: InvoiceRepository) {}

  async execute(input: ListAdminInvoicesInput) {
    const page = Math.max(input.page ?? 1, 1);
    const limit = Math.min(Math.max(input.limit ?? 20, 1), 100);

    const options: FindAdminInvoicesOptions = {
      page,
      limit,
      search: input.search?.trim() || undefined,
      status: input.status,
    };

    const result = await this.invoiceRepository.findManyForAdmin(options);

    return {
      invoices: result.invoices,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }
}
