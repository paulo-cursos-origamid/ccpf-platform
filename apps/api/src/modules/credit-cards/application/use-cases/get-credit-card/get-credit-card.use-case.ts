import { Injectable, NotFoundException } from '@nestjs/common';

import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { CreditCardRepository } from '../../../domain/repositories/credit-card.repository';
import {
  CreditCardOutput,
  toCreditCardOutput,
} from '../../dto/credit-card.output';
import { ensureActiveTenantMember } from '../../policies/credit-card-access.policy';

export interface GetCreditCardInput {
  userId: string;
  tenantId: string;
  cardId: string;
}

@Injectable()
export class GetCreditCardUseCase {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: GetCreditCardInput): Promise<CreditCardOutput> {
    await ensureActiveTenantMember(
      this.tenantMemberRepository,
      input.tenantId,
      input.userId,
    );

    const card = await this.creditCardRepository.findById(
      input.cardId,
      input.tenantId,
    );

    if (!card) {
      throw new NotFoundException('Credit card not found');
    }

    return toCreditCardOutput(card);
  }
}
