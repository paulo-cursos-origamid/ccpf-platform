import { CreditCardEntity } from './credit-card.entity';
import { CreditCardBrand } from '../enums/credit-card-brand.enum';
import { CreditCardStatus } from '../enums/credit-card-status.enum';

describe('CreditCardEntity', () => {
  const createCard = (
    overrides: Partial<ConstructorParameters<typeof CreditCardEntity>[0]> = {},
  ) =>
    new CreditCardEntity({
      tenantId: 'tenant-1',
      name: 'Cartão principal',
      brand: CreditCardBrand.VISA,
      lastFourDigits: '1234',
      creditLimit: 5000,
      closingDay: 10,
      dueDay: 20,
      ...overrides,
    });

  it('creates an active credit card', () => {
    const card = createCard();

    expect(card.name).toBe('Cartão principal');
    expect(card.brand).toBe(CreditCardBrand.VISA);
    expect(card.status).toBe(CreditCardStatus.ACTIVE);
    expect(card.archivedAt).toBeNull();
  });

  it('normalizes the card name', () => {
    const card = createCard({ name: '  Cartão principal  ' });

    expect(card.name).toBe('Cartão principal');
  });

  it('generates an id when one is not provided', () => {
    expect(createCard().id).toBeTruthy();
  });

  it('rejects an empty tenant', () => {
    expect(() => createCard({ tenantId: '  ' })).toThrow();
  });

  it('rejects invalid names', () => {
    expect(() => createCard({ name: 'A' })).toThrow();
    expect(() => createCard({ name: 'A'.repeat(101) })).toThrow();
  });

  it('rejects invalid brands', () => {
    expect(() => createCard({ brand: 'INVALID' as CreditCardBrand })).toThrow();
  });

  it('accepts a card without last four digits', () => {
    const card = createCard({ lastFourDigits: null });

    expect(card.lastFourDigits).toBeNull();
  });

  it('rejects invalid last four digits', () => {
    expect(() => createCard({ lastFourDigits: '123' })).toThrow();
    expect(() => createCard({ lastFourDigits: '12345' })).toThrow();
    expect(() => createCard({ lastFourDigits: '12A4' })).toThrow();
  });

  it('rejects invalid credit limits', () => {
    expect(() => createCard({ creditLimit: 0 })).toThrow();
    expect(() => createCard({ creditLimit: -100 })).toThrow();
    expect(() => createCard({ creditLimit: Number.NaN })).toThrow();
    expect(() =>
      createCard({ creditLimit: Number.POSITIVE_INFINITY }),
    ).toThrow();
    expect(() => createCard({ creditLimit: 10.999 })).toThrow();
    expect(() => createCard({ creditLimit: 10_000_000_000 })).toThrow();
  });

  it('accepts a credit limit with two decimal places', () => {
    const card = createCard({ creditLimit: 1500.75 });

    expect(card.creditLimit).toBe(1500.75);
  });

  it('rejects invalid closing and due days', () => {
    expect(() => createCard({ closingDay: 0 })).toThrow();
    expect(() => createCard({ closingDay: 32 })).toThrow();
    expect(() => createCard({ closingDay: 10.5 })).toThrow();

    expect(() => createCard({ dueDay: 0 })).toThrow();
    expect(() => createCard({ dueDay: 32 })).toThrow();
    expect(() => createCard({ dueDay: 20.5 })).toThrow();
  });

  it('updates an active credit card', () => {
    const card = createCard();

    card.updateDetails({
      name: 'Cartão secundário',
      brand: CreditCardBrand.MASTERCARD,
      lastFourDigits: '9876',
      creditLimit: 8000,
      closingDay: 15,
      dueDay: 25,
    });

    expect(card.name).toBe('Cartão secundário');
    expect(card.brand).toBe(CreditCardBrand.MASTERCARD);
    expect(card.lastFourDigits).toBe('9876');
    expect(card.creditLimit).toBe(8000);
    expect(card.closingDay).toBe(15);
    expect(card.dueDay).toBe(25);
  });

  it('archives a credit card and records the archive date', () => {
    const card = createCard();

    card.archive();

    expect(card.status).toBe(CreditCardStatus.ARCHIVED);
    expect(card.archivedAt).toBeInstanceOf(Date);
  });

  it('does not allow archiving twice', () => {
    const card = createCard();

    card.archive();

    expect(() => card.archive()).toThrow();
  });

  it('does not allow updating an archived card', () => {
    const card = createCard();

    card.archive();

    expect(() =>
      card.updateDetails({
        name: 'Novo nome',
        brand: CreditCardBrand.VISA,
        creditLimit: 1000,
        closingDay: 10,
        dueDay: 20,
      }),
    ).toThrow();
  });

  it('rejects an active card with archivedAt', () => {
    expect(() =>
      createCard({
        archivedAt: new Date(),
      }),
    ).toThrow();
  });

  it('updates only the supplied name and preserves other fields', () => {
    const card = createCard();

    card.updateDetails({ name: 'Cartão atualizado' });

    expect(card.name).toBe('Cartão atualizado');
    expect(card.brand).toBe(CreditCardBrand.VISA);
    expect(card.lastFourDigits).toBe('1234');
    expect(card.creditLimit).toBe(5000);
    expect(card.closingDay).toBe(10);
    expect(card.dueDay).toBe(20);
  });

  it('allows clearing last four digits with null', () => {
    const card = createCard();

    card.updateDetails({ lastFourDigits: null });

    expect(card.lastFourDigits).toBeNull();
  });

  it('preserves last four digits when the field is omitted', () => {
    const card = createCard();

    card.updateDetails({ name: 'Novo nome' });

    expect(card.lastFourDigits).toBe('1234');
  });
});
