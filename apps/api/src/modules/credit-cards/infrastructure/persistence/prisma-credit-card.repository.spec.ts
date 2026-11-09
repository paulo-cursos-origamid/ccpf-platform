import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../infrastructure/database/prisma.service';

import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { CreditCardBrand } from '../../domain/enums/credit-card-brand.enum';
import { CreditCardStatus } from '../../domain/enums/credit-card-status.enum';
import { PrismaCreditCardRepository } from './prisma-credit-card.repository';

describe('PrismaCreditCardRepository', () => {
  const createdAt = new Date('2026-11-06T12:00:00.000Z');
  const updatedAt = new Date('2026-11-06T13:00:00.000Z');

  const card = new CreditCardEntity({
    id: 'card-1',
    tenantId: 'tenant-1',
    name: 'Cartão principal',
    brand: CreditCardBrand.VISA,
    lastFourDigits: '1234',
    creditLimit: 5000.5,
    closingDay: 10,
    dueDay: 17,
    createdAt,
    updatedAt,
  });

  let prisma: any;
  let repository: PrismaCreditCardRepository;

  const rawCard = (overrides: Record<string, unknown> = {}) => ({
    id: card.id,
    tenantId: card.tenantId,
    name: card.name,
    brand: 'VISA',
    lastFourDigits: '1234',
    creditLimit: new Prisma.Decimal('5000.50'),
    closingDay: 10,
    dueDay: 17,
    status: 'ACTIVE',
    archivedAt: null,
    createdAt,
    updatedAt,
    ...overrides,
  });

  beforeEach(() => {
    prisma = {
      creditCard: {
        create: jest.fn().mockResolvedValue(rawCard()),
        findFirst: jest.fn().mockResolvedValue(rawCard()),
        findMany: jest.fn().mockResolvedValue([rawCard()]),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };

    repository = new PrismaCreditCardRepository(prisma as PrismaService);
  });

  describe('create', () => {
    it('creates a card with tenant isolation and decimal precision', async () => {
      const result = await repository.create(card, 'tenant-1');

      expect(result).toBeInstanceOf(CreditCardEntity);
      expect(result.creditLimit).toBe(5000.5);
      expect(prisma.creditCard.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'card-1',
          tenantId: 'tenant-1',
          name: 'Cartão principal',
          brand: 'VISA',
          lastFourDigits: '1234',
          creditLimit: new Prisma.Decimal('5000.5'),
          closingDay: 10,
          dueDay: 17,
          status: 'ACTIVE',
          archivedAt: null,
        }),
      });
    });

    it('rejects a tenant different from the card tenant', async () => {
      await expect(repository.create(card, 'tenant-2')).rejects.toThrow(
        'Credit card does not belong to the specified Tenant',
      );

      expect(prisma.creditCard.create).not.toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('finds a card within the specified tenant', async () => {
      const result = await repository.findById('card-1', 'tenant-1');

      expect(result?.id).toBe('card-1');
      expect(result?.tenantId).toBe('tenant-1');
      expect(prisma.creditCard.findFirst).toHaveBeenCalledWith({
        where: { id: 'card-1', tenantId: 'tenant-1' },
      });
    });

    it('returns null when the card does not exist in the tenant', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      const result = await repository.findById('card-1', 'tenant-2');

      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('lists cards restricted to the tenant and ordered by creation date', async () => {
      const result = await repository.findMany('tenant-1');

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CreditCardEntity);
      expect(prisma.creditCard.findMany).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-1' },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('returns an empty list when the tenant has no cards', async () => {
      prisma.creditCard.findMany.mockResolvedValue([]);

      const result = await repository.findMany('tenant-1');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    const updatedCard = () =>
      new CreditCardEntity({
        id: card.id,
        tenantId: card.tenantId,
        name: 'Cartão atualizado',
        brand: CreditCardBrand.MASTERCARD,
        lastFourDigits: '5678',
        creditLimit: 7500,
        closingDay: 12,
        dueDay: 19,
        status: CreditCardStatus.ACTIVE,
        createdAt: card.createdAt,
        updatedAt,
      });

    it('updates a card using id and tenant and fetches it within the same tenant', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(
        rawCard({
          name: 'Cartão atualizado',
          brand: 'MASTERCARD',
          lastFourDigits: '5678',
          creditLimit: new Prisma.Decimal('7500.00'),
          closingDay: 12,
          dueDay: 19,
        }),
      );

      const result = await repository.update(updatedCard(), 'tenant-1');

      expect(result.name).toBe('Cartão atualizado');
      expect(result.brand).toBe(CreditCardBrand.MASTERCARD);
      expect(result.creditLimit).toBe(7500);

      expect(prisma.creditCard.updateMany).toHaveBeenCalledWith({
        where: { id: 'card-1', tenantId: 'tenant-1' },
        data: expect.objectContaining({
          name: 'Cartão atualizado',
          brand: 'MASTERCARD',
          creditLimit: new Prisma.Decimal('7500'),
        }),
      });

      expect(prisma.creditCard.findFirst).toHaveBeenCalledWith({
        where: { id: 'card-1', tenantId: 'tenant-1' },
      });
    });

    it('rejects a tenant different from the card tenant', async () => {
      await expect(repository.update(card, 'tenant-2')).rejects.toThrow(
        'Credit card does not belong to the specified Tenant',
      );

      expect(prisma.creditCard.updateMany).not.toHaveBeenCalled();
    });

    it('throws when no card was updated in the specified tenant', async () => {
      prisma.creditCard.updateMany.mockResolvedValue({ count: 0 });

      await expect(repository.update(card, 'tenant-1')).rejects.toThrow(
        'Credit card not found in the specified Tenant',
      );

      expect(prisma.creditCard.findFirst).not.toHaveBeenCalled();
    });

    it('throws when the card cannot be found after update', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(repository.update(card, 'tenant-1')).rejects.toThrow(
        'Credit card not found after update',
      );
    });
  });

  it('maps archived cards from Prisma to the domain entity', async () => {
    prisma.creditCard.findFirst.mockResolvedValue(
      rawCard({
        status: 'ARCHIVED',
        archivedAt: updatedAt,
      }),
    );

    const result = await repository.findById('card-1', 'tenant-1');

    expect(result?.status).toBe(CreditCardStatus.ARCHIVED);
    expect(result?.archivedAt).toEqual(updatedAt);
  });
});
