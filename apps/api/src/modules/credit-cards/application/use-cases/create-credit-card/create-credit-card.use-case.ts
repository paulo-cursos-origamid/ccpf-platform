import { Injectable } from '@nestjs/common';

import { TenantMemberRepository } from '../../../../tenant/domain/repositories/tenant-member.repository';
import { CreditCardEntity } from '../../../domain/entities/credit-card.entity';
import { CreditCardBrand } from '../../../domain/enums/credit-card-brand.enum';
import { CreditCardRepository } from '../../../domain/repositories/credit-card.repository';
import { ensureTenantCardManager } from '../../policies/credit-card-access.policy';
import {
  CreditCardOutput,
  toCreditCardOutput,
} from '../../dto/credit-card.output';

export interface CreateCreditCardInput {
  userId: string;
  tenantId: string;
  name: string;
  brand: CreditCardBrand;
  lastFourDigits?: string | null;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
}

@Injectable()
export class CreateCreditCardUseCase {
  constructor(
    private readonly creditCardRepository: CreditCardRepository,
    private readonly tenantMemberRepository: TenantMemberRepository,
  ) {}

  async execute(input: CreateCreditCardInput): Promise<CreditCardOutput> {
    await ensureTenantCardManager(
      this.tenantMemberRepository,
      input.tenantId,
      input.userId,
    );

    const card = new CreditCardEntity({
      tenantId: input.tenantId,
      name: input.name,
      brand: input.brand,
      lastFourDigits: input.lastFourDigits,
      creditLimit: input.creditLimit,
      closingDay: input.closingDay,
      dueDay: input.dueDay,
    });

    const created = await this.creditCardRepository.create(
      card,
      input.tenantId,
    );

    return toCreditCardOutput(created);
  }
}
