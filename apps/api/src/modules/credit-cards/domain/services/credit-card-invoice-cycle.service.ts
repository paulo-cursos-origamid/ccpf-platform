export interface CreditCardInvoiceCycleInput {
  closingDay: number;
  dueDay: number;
  purchaseDate: Date;
  installmentNumber: number;
}

export interface CreditCardInvoiceCycle {
  referenceMonth: Date;
  closingDate: Date;
  dueDate: Date;
}

export class CreditCardInvoiceCycleService {
  static calculate(
    input: CreditCardInvoiceCycleInput,
  ): CreditCardInvoiceCycle {
    this.validate(input);

    const purchaseDate = new Date(input.purchaseDate);
    const purchaseYear = purchaseDate.getUTCFullYear();
    const purchaseMonth = purchaseDate.getUTCMonth();

    const firstInvoiceMonth =
      purchaseDate.getUTCDate() <= input.closingDay
        ? purchaseMonth
        : purchaseMonth + 1;

    const invoiceMonth = firstInvoiceMonth + input.installmentNumber - 1;
    const invoiceYear =
      purchaseYear + Math.floor(invoiceMonth / 12);
    const normalizedInvoiceMonth = invoiceMonth % 12;

    const referenceMonth = new Date(
      Date.UTC(invoiceYear, normalizedInvoiceMonth, 1),
    );

    const closingDate = this.createClampedDate(
      invoiceYear,
      normalizedInvoiceMonth,
      input.closingDay,
    );

    const dueDate = this.createClampedDate(
      invoiceYear,
      normalizedInvoiceMonth + 1,
      input.dueDay,
    );

    return {
      referenceMonth,
      closingDate,
      dueDate,
    };
  }

  static splitAmount(
    totalAmount: string,
    installmentCount: number,
  ): string[] {
    if (
      !Number.isInteger(installmentCount) ||
      installmentCount < 1 ||
      installmentCount > 120
    ) {
      throw new Error('Número de parcelas deve estar entre 1 e 120');
    }

    const normalizedAmount = totalAmount.trim();

    if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedAmount)) {
      throw new Error('Valor total inválido');
    }

    const [integerPart, decimalPart = ''] = normalizedAmount.split('.');
    const totalCents =
      BigInt(integerPart) * 100n +
      BigInt(decimalPart.padEnd(2, '0'));

    if (totalCents <= 0n) {
      throw new Error('Valor total deve ser positivo');
    }

    const count = BigInt(installmentCount);
    const baseAmount = totalCents / count;
    const remainder = totalCents % count;

    return Array.from({ length: installmentCount }, (_, index) => {
      const installmentCents =
        baseAmount + (BigInt(index) < remainder ? 1n : 0n);

      const whole = installmentCents / 100n;
      const fraction = String(installmentCents % 100n).padStart(2, '0');

      return `${whole}.${fraction}`;
    });
  }

  private static createClampedDate(
    year: number,
    month: number,
    requestedDay: number,
  ): Date {
    const normalizedYear = year + Math.floor(month / 12);
    const normalizedMonth = month % 12;
    const lastDay = new Date(
      Date.UTC(normalizedYear, normalizedMonth + 1, 0),
    ).getUTCDate();

    return new Date(
      Date.UTC(
        normalizedYear,
        normalizedMonth,
        Math.min(requestedDay, lastDay),
      ),
    );
  }

  private static validate(input: CreditCardInvoiceCycleInput): void {
    if (
      !(input.purchaseDate instanceof Date) ||
      Number.isNaN(input.purchaseDate.getTime())
    ) {
      throw new Error('Data da compra inválida');
    }

    if (
      !Number.isInteger(input.closingDay) ||
      input.closingDay < 1 ||
      input.closingDay > 31
    ) {
      throw new Error('Dia de fechamento inválido');
    }

    if (
      !Number.isInteger(input.dueDay) ||
      input.dueDay < 1 ||
      input.dueDay > 31
    ) {
      throw new Error('Dia de vencimento inválido');
    }

    if (
      !Number.isInteger(input.installmentNumber) ||
      input.installmentNumber < 1 ||
      input.installmentNumber > 120
    ) {
      throw new Error('Número da parcela deve estar entre 1 e 120');
    }
  }
}
