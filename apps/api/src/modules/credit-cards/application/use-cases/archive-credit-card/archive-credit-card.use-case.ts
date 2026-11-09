import { Injectable, NotFoundException } from '@nestjs/common';

import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { CreditCardRepository } from '../../../domain/repositories/credit-card.repository';
import {
  CreditCardOutput,
  toCreditCardOutput,
} from '../../dto/credit-card.output';
import { ensureTenantCardManager } from '../../policies/credit-card-access.policy';

export interface ArchiveCreditCardInput {
  userId: string;
  tenantId: string;
  cardId: string;
}

@Injectable()
export class ArchiveCreditCardUseCase {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: ArchiveCreditCardInput): Promise<CreditCardOutput> {
    await ensureTenantCardManager(
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

    card.archive();

    const archived = await this.creditCardRepository.update(
      card,
      input.tenantId,
    );

    return toCreditCardOutput(archived);
  }
}
