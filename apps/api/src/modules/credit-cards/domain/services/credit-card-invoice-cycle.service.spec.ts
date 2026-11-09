import { CreditCardInvoiceCycleService } from './credit-card-invoice-cycle.service';

describe('CreditCardInvoiceCycleService', () => {
  const calculate = (
    purchaseDate: string,
    closingDay = 10,
    dueDay = 17,
    installmentNumber = 1,
  ) =>
    CreditCardInvoiceCycleService.calculate({
      purchaseDate: new Date(purchaseDate),
      closingDay,
      dueDay,
      installmentNumber,
    });

  it('inclui compra realizada no dia do fechamento na fatura do mês', () => {
    const result = calculate('2026-11-10T12:00:00.000Z');

    expect(result.referenceMonth.toISOString()).toBe(
      '2026-11-01T00:00:00.000Z',
    );
    expect(result.closingDate.toISOString()).toBe(
      '2026-11-10T00:00:00.000Z',
    );
    expect(result.dueDate.toISOString()).toBe(
      '2026-12-17T00:00:00.000Z',
    );
  });

  it('direciona compra após o fechamento para o próximo ciclo', () => {
    const result = calculate('2026-11-11T12:00:00.000Z');

    expect(result.referenceMonth.toISOString()).toBe(
      '2026-12-01T00:00:00.000Z',
    );
    expect(result.closingDate.toISOString()).toBe(
      '2026-12-10T00:00:00.000Z',
    );
    expect(result.dueDate.toISOString()).toBe(
      '2027-01-17T00:00:00.000Z',
    );
  });

  it('avança o ciclo conforme o número da parcela', () => {
    const result = calculate(
      '2026-11-05T12:00:00.000Z',
      10,
      17,
      3,
    );

    expect(result.referenceMonth.toISOString()).toBe(
      '2027-01-01T00:00:00.000Z',
    );
    expect(result.closingDate.toISOString()).toBe(
      '2027-01-10T00:00:00.000Z',
    );
    expect(result.dueDate.toISOString()).toBe(
      '2027-02-17T00:00:00.000Z',
    );
  });

  it('ajusta fechamento e vencimento para o último dia do mês', () => {
    const result = calculate(
      '2027-01-30T12:00:00.000Z',
      31,
      31,
    );

    expect(result.closingDate.toISOString()).toBe(
      '2027-01-31T00:00:00.000Z',
    );
    expect(result.dueDate.toISOString()).toBe(
      '2027-02-28T00:00:00.000Z',
    );
  });

  it('trata a virada de ano', () => {
    const result = calculate(
      '2026-12-11T12:00:00.000Z',
      10,
      20,
    );

    expect(result.referenceMonth.toISOString()).toBe(
      '2027-01-01T00:00:00.000Z',
    );
  });

  it('rejeita número de parcela inválido', () => {
    expect(() =>
      calculate('2026-11-05T12:00:00.000Z', 10, 17, 0),
    ).toThrow('Número da parcela deve estar entre 1 e 120');
  });

  it('rejeita data inválida', () => {
    expect(() =>
      calculate('data-invalida'),
    ).toThrow('Data da compra inválida');
  });

  describe('splitAmount', () => {
    it('divide o valor igualmente quando não há centavos restantes', () => {
      expect(CreditCardInvoiceCycleService.splitAmount('120.00', 3)).toEqual([
        '40.00',
        '40.00',
        '40.00',
      ]);
    });

    it('distribui os centavos restantes nas primeiras parcelas', () => {
      expect(CreditCardInvoiceCycleService.splitAmount('100.00', 3)).toEqual([
        '33.34',
        '33.33',
        '33.33',
      ]);
    });

    it('permite valores menores que a quantidade de parcelas', () => {
      expect(CreditCardInvoiceCycleService.splitAmount('0.05', 3)).toEqual([
        '0.02',
        '0.02',
        '0.01',
      ]);
    });

    it('preserva a soma total em centavos', () => {
      const installments = CreditCardInvoiceCycleService.splitAmount(
        '999.99',
        7,
      );

      const totalCents = installments.reduce((sum, amount) => {
        const [whole, fraction] = amount.split('.');
        return sum + BigInt(whole) * 100n + BigInt(fraction);
      }, 0n);

      expect(totalCents).toBe(99999n);
    });

    it('rejeita valores inválidos e quantidades de parcelas inválidas', () => {
      expect(() =>
        CreditCardInvoiceCycleService.splitAmount('0.00', 2),
      ).toThrow('Valor total deve ser positivo');

      expect(() =>
        CreditCardInvoiceCycleService.splitAmount('10.999', 2),
      ).toThrow('Valor total inválido');

      expect(() =>
        CreditCardInvoiceCycleService.splitAmount('10.00', 0),
      ).toThrow('Número de parcelas deve estar entre 1 e 120');
    });
  });

});
