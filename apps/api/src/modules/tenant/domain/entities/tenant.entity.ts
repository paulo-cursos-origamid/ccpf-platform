import { TenantStatus } from '../enums/tenant-status.enum';

/**
 * Representa um Tenant no domínio da aplicação.
 *
 * Um Tenant representa uma unidade isolada dentro da plataforma SaaS.
 *
 * Todos os recursos financeiros pertencentes a um cliente,
 * como Accounts e Transactions, deverão estar associados
 * a um Tenant.
 */
export class TenantEntity {
  constructor(
    public readonly id: string,
    public name: string,
    public slug: string,
    public status: TenantStatus,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}
}
