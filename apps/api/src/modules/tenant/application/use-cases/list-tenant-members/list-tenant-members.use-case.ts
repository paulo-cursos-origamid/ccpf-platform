import { Injectable } from '@nestjs/common';

import { TenantMemberRepository } from '../../../domain/repositories/tenant-member.repository';

export interface ListTenantMembersInput {
  tenantId: string;
}

export interface TenantMemberOutput {
  id: string;
  userId: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Lista os membros pertencentes ao Tenant ativo.
 *
 * A responsabilidade deste use case é somente orquestrar
 * a consulta do TenantMemberRepository.
 *
 * As regras de autorização das operações administrativas
 * permanecem nos respectivos use cases.
 */
@Injectable()
export class ListTenantMembersUseCase {
  constructor(
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: ListTenantMembersInput): Promise<TenantMemberOutput[]> {
    const members = await this.tenantMemberRepository.findByTenant(
      input.tenantId,
    );

    return members.map((member) => ({
      id: member.id,
      userId: member.userId,
      role: member.role,
      status: member.status,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    }));
  }
}
