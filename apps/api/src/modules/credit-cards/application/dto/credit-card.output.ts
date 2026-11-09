import { CreditCardEntity } from '../../domain/entities/credit-card.entity';
import { CreditCardBrand } from '../../domain/enums/credit-card-brand.enum';
import { CreditCardStatus } from '../../domain/enums/credit-card-status.enum';

export interface CreditCardOutput {
  id: string;
  tenantId: string;
  name: string;
  brand: CreditCardBrand;
  lastFourDigits: string | null;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  status: CreditCardStatus;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
}

export function toCreditCardOutput(card: CreditCardEntity): CreditCardOutput {
  return {
    id: card.id,
    tenantId: card.tenantId,
    name: card.name,
    brand: card.brand,
    lastFourDigits: card.lastFourDigits,
    creditLimit: card.creditLimit,
    closingDay: card.closingDay,
    dueDay: card.dueDay,
    status: card.status,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
    archivedAt: card.archivedAt,
  };
}
