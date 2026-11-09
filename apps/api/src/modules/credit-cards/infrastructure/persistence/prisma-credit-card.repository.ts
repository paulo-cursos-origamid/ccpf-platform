import { Injectable } from '@nestjs/common';
import {
  CreditCardBrand as PrismaCreditCardBrand,
  CreditCardStatus as PrismaCreditCardStatus,
  Prisma,
} from '@prisma/client';

import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { CreditCardBrand } from '../../domain/enums/credit-card-brand.enum';
import { CreditCardStatus } from '../../domain/enums/credit-card-status.enum';
import { CreditCardRepository } from '../../domain/repositories/credit-card.repository';

@Injectable()
export class PrismaCreditCardRepository implements CreditCardRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    card: CreditCardEntity,
    tenantId: string,
  ): Promise<CreditCardEntity> {
    this.ensureTenantConsistency(card, tenantId);

    const createdCard = await this.prisma.creditCard.create({
      data: {
        id: card.id,
        tenantId,
        name: card.name,
        brand: card.brand as PrismaCreditCardBrand,
        lastFourDigits: card.lastFourDigits,
        creditLimit: new Prisma.Decimal(card.creditLimit),
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        status: card.status as PrismaCreditCardStatus,
        archivedAt: card.archivedAt,
      },
    });

    return this.toDomain(createdCard);
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<CreditCardEntity | null> {
    const card = await this.prisma.creditCard.findFirst({
      where: { id, tenantId },
    });

    return card ? this.toDomain(card) : null;
  }

  async findMany(tenantId: string): Promise<CreditCardEntity[]> {
    const cards = await this.prisma.creditCard.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return cards.map((card) => this.toDomain(card));
  }

  async update(
    card: CreditCardEntity,
    tenantId: string,
  ): Promise<CreditCardEntity> {
    this.ensureTenantConsistency(card, tenantId);

    const result = await this.prisma.creditCard.updateMany({
      where: {
        id: card.id,
        tenantId,
      },
      data: {
        name: card.name,
        brand: card.brand as PrismaCreditCardBrand,
        lastFourDigits: card.lastFourDigits,
        creditLimit: new Prisma.Decimal(card.creditLimit),
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        status: card.status as PrismaCreditCardStatus,
        archivedAt: card.archivedAt,
      },
    });

    if (result.count === 0) {
      throw new Error('Credit card not found in the specified Tenant');
    }

    const persistedCard = await this.prisma.creditCard.findFirst({
      where: {
        id: card.id,
        tenantId,
      },
    });

    if (!persistedCard) {
      throw new Error('Credit card not found after update');
    }

    return this.toDomain(persistedCard);
  }

  private ensureTenantConsistency(
    card: CreditCardEntity,
    tenantId: string,
  ): void {
    if (card.tenantId !== tenantId) {
      throw new Error('Credit card does not belong to the specified Tenant');
    }
  }

  private toDomain(rawCard: {
    id: string;
    tenantId: string;
    name: string;
    brand: PrismaCreditCardBrand;
    lastFourDigits: string | null;
    creditLimit: Prisma.Decimal;
    closingDay: number;
    dueDay: number;
    status: PrismaCreditCardStatus;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): CreditCardEntity {
    return new CreditCardEntity({
      id: rawCard.id,
      tenantId: rawCard.tenantId,
      name: rawCard.name,
      brand: rawCard.brand as CreditCardBrand,
      lastFourDigits: rawCard.lastFourDigits,
      creditLimit: Number(rawCard.creditLimit),
      closingDay: rawCard.closingDay,
      dueDay: rawCard.dueDay,
      status: rawCard.status as CreditCardStatus,
      archivedAt: rawCard.archivedAt,
      createdAt: rawCard.createdAt,
      updatedAt: rawCard.updatedAt,
    });
  }
}
