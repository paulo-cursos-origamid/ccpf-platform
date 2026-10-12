import { BadRequestException, Injectable } from '@nestjs/common';

import { BillingInterval } from '../enums/billing-interval.enum';

@Injectable()
export class BillingDateService {
  /**
   * Calcula o final do período comercial.
   *
   * Lifetime não possui renovação. Ainda assim, mantemos
   * currentPeriodEnd como marco lógico do período contratado.
   */
  calculatePeriodEnd(
    start: Date,
    interval: BillingInterval,
    billingDay: number | null = start.getDate(),
  ): Date | null {
    if (interval === BillingInterval.LIFETIME) {
      return new Date(start);
    }

    if (billingDay === null) {
      throw new BadRequestException(
        'O dia de cobrança é obrigatório para assinaturas recorrentes.',
      );
    }

    this.validateBillingDay(billingDay);

    return this.addIntervalWithBillingDay(start, interval, billingDay);
  }

  /**
   * Calcula a próxima cobrança respeitando o billingDay.
   *
   * Quando o mês não possui o dia escolhido, utiliza o último
   * dia disponível daquele mês.
   */
  calculateNextBillingDate(
    referenceDate: Date,
    billingDay: number | null,
    interval: BillingInterval,
  ): Date | null {
    if (interval === BillingInterval.LIFETIME) {
      return null;
    }

    if (billingDay === null) {
      throw new BadRequestException(
        'O dia de cobrança é obrigatório para assinaturas recorrentes.',
      );
    }

    this.validateBillingDay(billingDay);

    return this.addIntervalWithBillingDay(referenceDate, interval, billingDay);
  }

  /**
   * Valida e normaliza o billingDay conforme a modalidade.
   *
   * Lifetime não possui dia de cobrança.
   */
  validateBillingDayForInterval(
    billingDay: number | undefined,
    interval: BillingInterval,
  ): number | null {
    if (interval === BillingInterval.LIFETIME) {
      return null;
    }

    if (billingDay === undefined) {
      throw new BadRequestException(
        'O dia de cobrança é obrigatório para modalidades recorrentes.',
      );
    }

    this.validateBillingDay(billingDay);

    return billingDay;
  }

  validateBillingDay(billingDay: number): void {
    if (!Number.isInteger(billingDay) || billingDay < 1 || billingDay > 31) {
      throw new BadRequestException(
        'O dia de cobrança deve estar entre 1 e 31.',
      );
    }
  }

  normalizeBillingDay(year: number, month: number, billingDay: number): number {
    this.validateBillingDay(billingDay);

    return Math.min(billingDay, new Date(year, month + 1, 0).getDate());
  }

  private addIntervalWithBillingDay(
    referenceDate: Date,
    interval: BillingInterval,
    billingDay: number,
  ): Date {
    const result = new Date(referenceDate);

    if (interval === BillingInterval.SEMESTERLY) {
      result.setMonth(result.getMonth() + 6, 1);
    } else if (interval === BillingInterval.YEARLY) {
      result.setFullYear(result.getFullYear() + 1, result.getMonth(), 1);
    } else {
      throw new BadRequestException(
        `Intervalo de cobrança não suportado: ${interval}.`,
      );
    }

    result.setDate(
      this.normalizeBillingDay(
        result.getFullYear(),
        result.getMonth(),
        billingDay,
      ),
    );

    return result;
  }
}
