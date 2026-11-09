import { Injectable } from '@nestjs/common';

import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { CreditCardRepository } from '../../../domain/repositories/credit-card.repository';
import {
  CreditCardOutput,
  toCreditCardOutput,
} from '../../dto/credit-card.output';
import { ensureActiveTenantMember } from '../../policies/credit-card-access.policy';

export interface ListCreditCardsInput {
  userId: string;
  tenantId: string;
}

@Injectable()
export class ListCreditCardsUseCase {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: ListCreditCardsInput): Promise<CreditCardOutput[]> {
    await ensureActiveTenantMember(
      this.tenantMemberRepository,
      input.tenantId,
      input.userId,
    );

    const cards = await this.creditCardRepository.findMany(input.tenantId);

    return cards.map(toCreditCardOutput);
  }
}
