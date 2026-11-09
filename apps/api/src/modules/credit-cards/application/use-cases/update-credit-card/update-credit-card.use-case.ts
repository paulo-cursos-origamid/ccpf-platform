import { Injectable, NotFoundException } from '@nestjs/common';

import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { CreditCardBrand } from '../../../domain/enums/credit-card-brand.enum';
import { CreditCardRepository } from '../../../domain/repositories/credit-card.repository';
import {
  CreditCardOutput,
  toCreditCardOutput,
} from '../../dto/credit-card.output';
import { ensureTenantCardManager } from '../../policies/credit-card-access.policy';

export interface UpdateCreditCardInput {
  userId: string;
  tenantId: string;
  cardId: string;
  name?: string;
  brand?: CreditCardBrand;
  lastFourDigits?: string | null;
  creditLimit?: number;
  closingDay?: number;
  dueDay?: number;
}

@Injectable()
export class UpdateCreditCardUseCase {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: UpdateCreditCardInput): Promise<CreditCardOutput> {
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

    card.updateDetails({
      name: input.name,
      brand: input.brand,
      lastFourDigits: input.lastFourDigits,
      creditLimit: input.creditLimit,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
    });

    const updated = await this.creditCardRepository.update(
      card,
      input.tenantId,
    );

    return toCreditCardOutput(updated);
  }
}
